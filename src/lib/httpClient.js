'use strict';

/**
 * Puppeteer-based HTTP client that bypasses Cloudflare challenges.
 *
 * Architecture:
 * - A single headless Chromium instance is launched on first request (singleton).
 * - Cloudflare clearance cookies are maintained across requests in the browser session.
 * - get(path)         → navigates to the page, returns { data: html }.
 * - getStreamUrl(path)→ navigates to the player page, waits for the countdown,
 *                       intercepts the HLS/DASH manifest request, returns the URL.
 *
 * Puppeteer is lazy-loaded on first use so that the module can be required
 * (and mocked in tests) without Chromium needing to be installed.
 */

const { BASE_URL, PUPPETEER_HEADLESS } = require('../config/env');


// ── Singleton browser instance ────────────────────────────────────────────────
let _browser = null;
let _launchPromise = null;
let _puppeteerReady = false;

/**
 * Lazily require puppeteer-extra and register the stealth plugin.
 * Called once on first use so the module can be safely required in tests
 * without Chromium being installed.
 */
function ensurePuppeteer() {
  if (_puppeteerReady) return require('puppeteer-extra');
  const pptr = require('puppeteer-extra');
  const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  pptr.use(StealthPlugin());
  _puppeteerReady = true;
  return pptr;
}

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

/**
 * Get or create the singleton Puppeteer browser instance.
 * Thread-safe via promise memoisation.
 *
 * On first launch, a warmup page navigation to BASE_URL is performed to
 * solve the Cloudflare challenge once. All subsequent tabs opened in the
 * same browser context inherit the clearance cookies automatically.
 *
 * @returns {Promise<import('puppeteer').Browser>}
 */
async function getBrowser() {
  if (_browser && _browser.isConnected()) return _browser;

  // Prevent parallel launches
  if (_launchPromise) return _launchPromise;

  const puppeteer = ensurePuppeteer();

  _launchPromise = puppeteer
    .launch(LAUNCH_OPTS)
    .then(async (browser) => {
      _browser = browser;
      _launchPromise = null;

      // If Chromium crashes, clear the reference so the next call re-launches
      browser.on('disconnected', () => {
        _browser = null;
        _launchPromise = null;
      });

      // ── Cloudflare warmup ────────────────────────────────────────────────
      // Visit the home page once so CF issues clearance cookies for this
      // browser session. All subsequent tabs automatically inherit them.
      console.log('[browser] Warming up — solving Cloudflare challenge...');
      const warmup = await browser.newPage();
      try {
        await warmup.setViewport({ width: 1280, height: 800 });
        await warmup.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log('[browser] ✅ Cloudflare warmup complete');
      } catch (err) {
        console.warn(`[browser] Warmup warning: ${err.message}`);
      } finally {
        await warmup.close().catch(() => {});
      }

      return browser;
    });

  return _launchPromise;
}

/**
 * Open a new browser tab, navigate to the URL, wait for the page to settle,
 * and return the full HTML. Closes the tab when done.
 *
 * @param {string} url - Absolute URL to navigate to.
 * @param {object} [opts]
 * @param {number} [opts.timeout=30000] - Navigation timeout in ms.
 * @returns {Promise<string>} Full page HTML.
 */
async function fetchPage(url, { timeout = 30000 } = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Realistic viewport to reduce bot detection
    await page.setViewport({ width: 1280, height: 800 });

    // Block image/font/media requests on detail pages to speed up load
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const rt = req.resourceType();
      if (['image', 'font', 'media', 'stylesheet'].includes(rt)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout,
    });

    return await page.content();
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Extract the HLS/DASH stream URL for a movie or series page.
 *
 * Now uses the IDLIX internal API chain directly (all calls via page.evaluate
 * so the browser's CF clearance cookies are automatically included):
 *
 *   1. GET /api/movies/{slug}                        → content UUID
 *   2. GET /api/watch/play-info/{type}/{uuid}        → gateToken + countdown
 *   3. Wait for countdown (unlockAt - serverNow ms)
 *   4. POST /api/watch/session/claim                 → claim JWT + redeemUrl
 *   5. POST redeemUrl (majorplay.net/api/play)       → config JSON URL
 *   6. GET config JSON                               → actual HLS / MPD URL
 *
 * Falls back to passive response monitoring + click-play-button if the API
 * chain fails (e.g. different content type, future API changes).
 *
 * @param {string} url  Absolute URL of the player page (may include ?play=1).
 * @returns {Promise<string|null>}
 */
async function interceptStreamUrl(url) {
  const STREAM_TIMEOUT = 90000; // 90s: page load + countdown(15s) + API chain
  const POLL_INTERVAL  = 500;

  // Strip ?play=1 — we load the detail page first
  const detailUrl = url.replace(/[?&]play=1/, '');

  // Extract slug from the detail URL (last path segment)
  const slug     = detailUrl.split('/').filter(Boolean).pop();
  // Infer content type from URL ('movie' or 'series')
  const ctType   = detailUrl.includes('/series/') ? 'series' : 'movie';

  const STREAM_PATTERNS = [
    /\.m3u8(\?|$)/i, /\.mpd(\?|$)/i,
    /\/hls\//i, /\/dash\//i, /\/playlist\.m3u8/i,
  ];
  const EXCLUDE_PATTERNS = [
    /cast_sender/i, /gstatic\.com/i, /googleapis\.com/i,
    /youtube\.com/i, /cloudflare/i, /analytics/i,
    /doubleclick/i, /googlesyndication/i, /\.webmanifest/i,
  ];

  const isStreamUrl = (u) =>
    u && STREAM_PATTERNS.some(p => p.test(u)) && !EXCLUDE_PATTERNS.some(p => p.test(u));

  const browser = await getBrowser();
  const page    = await browser.newPage();

  try {
    await page.setViewport({ width: 1280, height: 800 });

    // Forward browser console.log → Node.js stdout (page.evaluate logs go here)
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[stream:eval]')) console.log(text);
    });

    // ── Log all notable responses (debug) ────────────────────────────────────
    page.on('response', (res) => {
      const u  = res.url();
      const ct = (res.headers()['content-type'] || '').split(';')[0].trim();
      if (!u.includes('/_next/static/') && !u.includes('google') && !u.includes('gstatic') &&
          !u.includes('youtube') && !u.includes('favicon') && !u.includes('tmdb.org')) {
        console.log(`[stream] ${res.status()} ${ct.padEnd(26)} ${u.substring(0, 120)}`);
      }
    });

    // ── Navigate to the detail page (no ?play=1, no Turnstile) ─────────────
    console.log(`[stream] Loading detail page: ${detailUrl}`);
    await page.goto(detailUrl, {
      waitUntil: 'networkidle2',
      timeout:   STREAM_TIMEOUT,
    }).catch(() => {});

    // If CF put us on a challenge page, wait for the redirect to the real page
    const landedUrl = page.url();
    if (!landedUrl.includes('idlixku.com') || landedUrl.includes('challenge-platform')) {
      console.warn(`[stream] Landed on unexpected URL: ${landedUrl} — waiting for navigation...`);
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    }
    console.log(`[stream] Page URL after load: ${page.url()}`);

    // ── Steps 1–4 inside browser (same-origin, uses CF cookies) ─────────────
    console.log('[stream] Running same-origin API chain (movies → play-info → claim)...');
    const claimResult = await page.evaluate(async (slug, ctType, baseUrl) => {
      const log = (msg) => console.log(`[stream:eval] ${msg}`);
      try {
        const getHdrs = {
          'accept'         : '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'origin'         : baseUrl,
          'referer'        : `${baseUrl}/${ctType}/${slug}`,
        };
        const postHdrs = { ...getHdrs, 'content-type': 'application/json' };

        // Step 1: Get content UUID
        const movRes = await fetch(`${baseUrl}/api/${ctType}s/${slug}`, {
          headers: getHdrs, credentials: 'include',
        });
        if (!movRes.ok) { log(`movies API ${movRes.status}`); return null; }
        const mov = await movRes.json();
        const uuid = mov?.id || mov?.data?.id;
        if (!uuid) { log('no UUID in movies response'); return null; }
        log(`UUID: ${uuid}`);

        // Step 2: Get play-info → gateToken + unlockAt
        const piRes = await fetch(`${baseUrl}/api/watch/play-info/${ctType}/${uuid}`, {
          headers: getHdrs, credentials: 'include',
        });
        if (!piRes.ok) { log(`play-info ${piRes.status}`); return null; }
        const pi = await piRes.json();
        if (pi.kind !== 'gate') { log(`unexpected play-info kind: ${pi.kind}`); return null; }
        const countdownMs = pi.unlockAt - pi.serverNow;
        const waitMs = Math.min(Math.max(0, countdownMs + 500), 20000);
        log(`Waiting ${waitMs}ms for countdown (unlockAt in ${countdownMs}ms)...`);
        await new Promise(r => setTimeout(r, waitMs));
        log('Countdown done — claiming session...');

        // Step 4: Claim session (POST, same-origin)
        const clRes = await fetch(`${baseUrl}/api/watch/session/claim`, {
          method: 'POST', headers: postHdrs, credentials: 'include',
          body: JSON.stringify({ gateToken: pi.gateToken }),
        });
        if (!clRes.ok) { log(`session/claim ${clRes.status}`); return null; }
        const cl = await clRes.json();
        if (!cl.claim || !cl.redeemUrl) { log('no claim in session/claim response'); return null; }
        log(`claim obtained → ${cl.redeemUrl}`);

        // Return claim data to Node.js (Steps 5–6 run outside the browser)
        return JSON.stringify({ claim: cl.claim, redeemUrl: cl.redeemUrl });
      } catch (e) {
        return `__error__:${e.message}`;
      }
    }, slug, ctType, BASE_URL);

    if (claimResult && !claimResult.startsWith('__error__')) {
      // ── Steps 5–6 in Node.js (no CORS, no browser sandbox) ───────────────
      try {
        const { claim, redeemUrl } = JSON.parse(claimResult);
        const UA = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36';

        // Step 5: POST claim to majorplay (cross-origin — runs fine in Node.js)
        console.log(`[stream] Step 5: POST ${redeemUrl}`);
        const mpRes = await fetch(redeemUrl, {
          method : 'POST',
          headers: {
            'accept'        : '*/*',
            'content-type'  : 'text/plain',
            'origin'        : BASE_URL,
            'referer'       : `${BASE_URL}/`,
            'user-agent'    : UA,
          },
          body: JSON.stringify({ claim }),
        });
        if (!mpRes.ok) {
          console.warn(`[stream] majorplay ${mpRes.status}`);
        } else {
          const mp = await mpRes.json();
          console.log(`[stream] majorplay response code: ${mp.code}`);
          if (mp.code === 'ok' && mp.url) {
            console.log(`[stream] Step 6: GET config ${mp.url.substring(0, 100)}`);

            // Step 6: Fetch the config URL and detect what it returns
            const cfRes = await fetch(mp.url, {
              headers: { 'accept': '*/*', 'user-agent': UA },
            });
            if (cfRes.ok) {
              const ct   = (cfRes.headers.get('content-type') || '').toLowerCase();
              const body = await cfRes.text();

              // If the response IS an HLS/DASH manifest, mp.url is the stream URL
              if (body.trimStart().startsWith('#EXTM3U') ||
                  ct.includes('mpegurl') || ct.includes('x-mpegurl') ||
                  ct.includes('dash+xml')) {
                console.log(`[stream] ✅ mp.url is the HLS/M3U8 stream directly`);
                console.log(`[stream] ✅ Via API chain: ${mp.url.substring(0, 100)}`);
                return mp.url;
              }

              // Otherwise try JSON parsing to find nested HLS URL
              try {
                const cfg = JSON.parse(body);
                console.log(`[stream] Config JSON keys: ${Object.keys(cfg).join(', ')}`);

                const findHls = (obj, d = 0) => {
                  if (!obj || typeof obj !== 'object' || d > 8) return null;
                  for (const [, v] of Object.entries(obj)) {
                    if (typeof v === 'string' && (v.includes('.m3u8') || v.includes('.mpd'))) return v;
                    if (Array.isArray(v)) { for (const i of v) { const r = findHls(i, d+1); if (r) return r; } }
                    else if (v && typeof v === 'object') { const r = findHls(v, d+1); if (r) return r; }
                  }
                  return null;
                };
                const hlsUrl = findHls(cfg) || cfg.src || cfg.url || cfg.hls || mp.url;
                console.log(`[stream] ✅ Via API chain: ${hlsUrl.substring(0, 100)}`);
                return hlsUrl;
              } catch (_) {
                // Not JSON either — check if any m3u8 URL appears in the raw text
                const m3u8 = body.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i);
                const hit  = m3u8?.[0] || mp.url;
                console.log(`[stream] ✅ Via API chain (raw scan): ${hit.substring(0, 100)}`);
                return hit;
              }
            } else {
              console.warn(`[stream] config fetch ${cfRes.status} — returning config URL`);
              return mp.url;
            }
          }
        }
      } catch (nodeErr) {
        console.warn(`[stream] Node.js steps 5–6 error: ${nodeErr.message}`);
      }
    } else if (claimResult?.startsWith('__error__')) {
      console.warn(`[stream] API chain error: ${claimResult.replace('__error__:', '')}`);
    }

    // ── Fallback: passive response monitor + click play button ─────────────
    console.log('[stream] Falling back to page interception...');
    let captured = null;

    page.on('response', async (res) => {
      if (captured) return;
      const resUrl = res.url();
      const ct = (res.headers()['content-type'] || '').toLowerCase();
      if (ct.includes('mpegurl') || ct.includes('dash+xml')) {
        if (!EXCLUDE_PATTERNS.some(p => p.test(resUrl))) { captured = resUrl; }
      }
      if (!captured && isStreamUrl(resUrl)) { captured = resUrl; }
      if (!captured && (ct.includes('application/json') || ct.includes('text/plain'))) {
        try {
          const body = await res.text().catch(() => '');
          const m3u8 = body.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i);
          const mpd  = body.match(/https?:\/\/[^\s"'<>]+\.mpd[^\s"'<>]*/i);
          const hit  = m3u8?.[0] || mpd?.[0];
          if (hit && !EXCLUDE_PATTERNS.some(p => p.test(hit))) captured = hit;
        } catch (_) {}
      }
    });

    await page.evaluate(() => {
      const btn = document.querySelector('.detail-backdrop button') ||
                  document.querySelector('.min-h-svh button');
      if (btn) btn.click();
    }).catch(() => {});

    const deadline = Date.now() + 30000; // 30s fallback window
    while (!captured && Date.now() < deadline) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL));
    }

    return captured || null;
  } catch (err) {
    return captured || null;
  } finally {
    await page.close().catch(() => {});
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

const httpClient = {
  /**
   * GET a path on the upstream IDLIX site.
   * Compatible with the old cloudscraper API: returns Promise<{ data: string }>.
   *
   * @param {string} path - Path relative to BASE_URL (e.g. "/movie").
   * @returns {Promise<{ data: string }>}
   */
  async get(path) {
    const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const data = await fetchPage(url);
    return { data };
  },

  /**
   * Extract the stream URL for a player page by intercepting the manifest request.
   *
   * @param {string} path - Path relative to BASE_URL (e.g. "/movie/slug?play=1").
   * @returns {Promise<string|null>}
   */
  async getStreamUrl(path) {
    const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    return interceptStreamUrl(url);
  },

  /**
   * Gracefully close the Puppeteer browser instance.
   * Call this on process exit to avoid zombie Chromium processes.
   */
  async close() {
    if (_browser) {
      await _browser.close().catch(() => {});
      _browser = null;
    }
  },

  /**
   * Fetch a JSON API endpoint using the browser's existing session cookies.
   * The browser must already have CF clearance (guaranteed by the warmup in getBrowser).
   * Uses page.evaluate(fetch) so cookies are inherited from the browser context.
   *
   * @param {string} path - Path relative to BASE_URL (e.g. "/api/movies/slug").
   * @returns {Promise<Object|null>} Parsed JSON or null on failure.
   */
  async getJson(path) {
    const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      // Navigate to the same origin so fetch() can send the correct cookies
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});

      const result = await page.evaluate(async (fetchUrl) => {
        try {
          const res = await fetch(fetchUrl, {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'include',
          });
          if (!res.ok) return null;
          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) return null;
          return await res.json();
        } catch (_) {
          return null;
        }
      }, url);

      return result;
    } catch (_) {
      return null;
    } finally {
      await page.close().catch(() => {});
    }
  },
};

// ── Graceful shutdown ──────────────────────────────────────────────────────────
process.on('exit', () => { if (_browser) _browser.close().catch(() => {}); });
process.on('SIGINT', async () => { await httpClient.close(); process.exit(0); });
process.on('SIGTERM', async () => { await httpClient.close(); process.exit(0); });

module.exports = httpClient;