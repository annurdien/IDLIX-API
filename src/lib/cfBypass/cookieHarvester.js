'use strict';

/**
 * Cloudflare Browser Session
 *
 * Keeps a single Puppeteer browser + page alive as a singleton.
 * The page is parked at BASE_URL after solving the initial CF challenge,
 * giving us the correct TLS fingerprint (Chromium/BoringSSL) for all
 * subsequent same-origin requests.
 *
 * Public API:
 *
 *   browserFetch(url, opts)  → { status, ok, text }
 *     Runs fetch() inside the browser page. Cookies, TLS fingerprint and
 *     User-Agent all match what Cloudflare expects. Use for any
 *     z2.idlixku.com call that is protected by Cloudflare Bot Management.
 *
 *   fetchHtml(url)           → html string
 *     Navigates to a URL via page.goto() and returns page.content().
 *     Opens a fresh tab per call (closed afterwards) to avoid polluting
 *     the persistent API page.
 *
 *   getCookieHeader()        → "cf_clearance=...; did=..."
 *     Extracts the current CF cookies as a header string. Useful for
 *     Node.js fetch() calls to non-CF-protected domains (e.g. majorplay.net).
 *
 *   invalidate()             → void
 *     Closes the browser. It will be re-launched on the next call.
 *
 * Manual override:
 *   Set CF_CLEARANCE + DID env vars to skip Puppeteer entirely for
 *   getCookieHeader(). browserFetch() always requires the browser.
 */

const { BASE_URL, PUPPETEER_HEADLESS } = require('../../config/env');

const UA = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36';

const LAUNCH_OPTS = {
  headless: PUPPETEER_HEADLESS,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
  ],
};

// ── Singleton state ────────────────────────────────────────────────────────────
let _browser     = null;
let _apiPage     = null; // persistent page parked at BASE_URL
let _initPromise = null; // prevents parallel launches

/**
 * Generate a random 32-char hex device ID matching IDLIX's format.
 * @returns {string}
 */
function generateDid() {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

/**
 * Lazily require and configure puppeteer-extra with the stealth plugin.
 * @returns {object} puppeteer-extra instance
 */
function getPuppeteer() {
  const pptr = require('puppeteer-extra');
  const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  pptr.use(StealthPlugin());
  return pptr;
}

/**
 * Launch browser, solve CF challenge, park the API page at BASE_URL.
 * @returns {Promise<void>}
 */
async function initialize() {
  console.log('[browser] Launching browser...');
  const pptr = getPuppeteer();

  _browser = await pptr.launch(LAUNCH_OPTS);

  _browser.on('disconnected', () => {
    console.warn('[browser] Browser disconnected — will re-launch on next request');
    _browser     = null;
    _apiPage     = null;
    _initPromise = null;
  });

  _apiPage = await _browser.newPage();
  await _apiPage.setUserAgent(UA);
  await _apiPage.setViewport({ width: 1280, height: 800 });

  // Minimal request blocking on the API page (no media/fonts/images needed)
  await _apiPage.setRequestInterception(true);
  _apiPage.on('request', (req) => {
    const rt = req.resourceType();
    if (['image', 'font', 'media', 'stylesheet'].includes(rt)) req.abort();
    else req.continue();
  });

  console.log(`[browser] Navigating to ${BASE_URL} (CF challenge solve)...`);
  await _apiPage.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait for cf_clearance to appear (up to 15 s)
  let cfClearance = null;
  const deadline = Date.now() + 15000;
  while (!cfClearance && Date.now() < deadline) {
    const cookies = await _apiPage.cookies();
    const cf = cookies.find(c => c.name === 'cf_clearance');
    if (cf) cfClearance = cf.value;
    else await new Promise(r => setTimeout(r, 500));
  }

  if (cfClearance) {
    console.log('[browser] ✅ cf_clearance obtained — API page ready');
  } else {
    console.warn('[browser] cf_clearance not found after 15 s — proceeding anyway');
  }
}

/**
 * Get (or create) the initialized browser session.
 * Thread-safe via promise memoization.
 * @returns {Promise<void>}
 */
async function ensureReady() {
  if (_browser && _browser.isConnected() && _apiPage && !_apiPage.isClosed()) return;
  if (_initPromise) return _initPromise;

  _initPromise = initialize()
    .then(() => { _initPromise = null; })
    .catch((err) => {
      _initPromise = null;
      _browser     = null;
      _apiPage     = null;
      throw err;
    });

  return _initPromise;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Run a fetch() call inside the browser page (correct TLS fingerprint + cookies).
 *
 * The page is already parked at BASE_URL so all same-origin cookies are
 * automatically included via credentials:'include'.
 *
 * @param {string} url
 * @param {object} [opts]
 * @param {string} [opts.method='GET']
 * @param {string} [opts.body]           - Request body (string or JSON string)
 * @param {object} [opts.headers={}]     - Extra headers to merge in
 * @returns {Promise<{ status: number, ok: boolean, text: string }>}
 */
async function browserFetch(url, { method = 'GET', body, headers = {} } = {}) {
  await ensureReady();

  const result = await _apiPage.evaluate(
    async (url, method, body, extraHeaders) => {
      try {
        const opts = {
          method,
          credentials: 'include',
          headers: {
            'accept':          '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'cache-control':   'no-cache',
            'pragma':          'no-cache',
            ...extraHeaders,
          },
        };
        if (body !== undefined) opts.body = body;

        const res  = await fetch(url, opts);
        const text = await res.text();
        return { status: res.status, ok: res.ok, text };
      } catch (e) {
        return { status: 0, ok: false, text: e.message };
      }
    },
    url, method, body, headers
  );

  // If CF is re-challenging, re-initialize then retry once
  if (result.status === 403 || (result.ok === false && result.text.includes('cf-'))) {
    console.warn('[browser] 403 on browserFetch — re-initializing and retrying...');
    await invalidate();
    await ensureReady();

    return _apiPage.evaluate(
      async (url, method, body, extraHeaders) => {
        try {
          const opts = {
            method,
            credentials: 'include',
            headers: {
              'accept':          '*/*',
              'accept-language': 'en-US,en;q=0.9',
              'cache-control':   'no-cache',
              'pragma':          'no-cache',
              ...extraHeaders,
            },
          };
          if (body !== undefined) opts.body = body;
          const res  = await fetch(url, opts);
          const text = await res.text();
          return { status: res.status, ok: res.ok, text };
        } catch (e) {
          return { status: 0, ok: false, text: e.message };
        }
      },
      url, method, body, headers
    );
  }

  return result;
}

/**
 * Fetch HTML for a given URL using the parked browser page.
 * This replaces the old `page.goto()` approach which triggered CF challenges
 * on every new tab. By using `fetch()` inside the existing API page context,
 * we perfectly evade Cloudflare.
 *
 * @param {string} url
 * @param {number} [timeout=30000] (unused, kept for compatibility)
 * @returns {Promise<string>} Full page HTML
 */
async function fetchHtml(url, timeout = 30000) {
  const res = await browserFetch(url, {
    headers: {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    }
  });
  
  if (!res.ok) {
    console.warn(`[browser] fetchHtml warning: ${res.status} on ${url}`);
  }
  
  return res.text;
}

/**
 * Extract the current CF cookies as a header string.
 * If CF_CLEARANCE + DID env vars are set, those are used directly.
 *
 * @returns {Promise<string>} e.g. "cf_clearance=abc; did=def; NEXT_LOCALE=en"
 */
async function getCookieHeader() {
  // Manual override
  if (process.env.CF_CLEARANCE) {
    const did    = process.env.DID    || generateDid();
    const locale = process.env.NEXT_LOCALE || 'en';
    return `cf_clearance=${process.env.CF_CLEARANCE}; did=${did}; NEXT_LOCALE=${locale}`;
  }

  await ensureReady();

  const cookies  = await _apiPage.cookies();
  const cookieMap = Object.fromEntries(cookies.map(c => [c.name, c.value]));

  const parts = [];
  if (cookieMap.cf_clearance) parts.push(`cf_clearance=${cookieMap.cf_clearance}`);
  parts.push(`did=${cookieMap.did || generateDid()}`);
  if (cookieMap.NEXT_LOCALE)  parts.push(`NEXT_LOCALE=${cookieMap.NEXT_LOCALE}`);
  if (cookieMap._ga)          parts.push(`_ga=${cookieMap._ga}`);

  return parts.join('; ');
}

/**
 * Tear down the browser. It will be re-launched on the next request.
 * @returns {Promise<void>}
 */
async function invalidate() {
  console.log('[browser] Closing browser (will re-launch on next request)');
  if (_browser) {
    await _browser.close().catch(() => {});
  }
  _browser     = null;
  _apiPage     = null;
  _initPromise = null;
}

// ── Graceful shutdown ──────────────────────────────────────────────────────────
process.on('exit',   () => { if (_browser) _browser.close().catch(() => {}); });
process.on('SIGINT',  async () => { await invalidate(); process.exit(0); });
process.on('SIGTERM', async () => { await invalidate(); process.exit(0); });

module.exports = { browserFetch, fetchHtml, getCookieHeader, invalidate };
