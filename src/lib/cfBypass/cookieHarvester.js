'use strict';

const { BASE_URL, STEALTH_API_URL } = require('../../config/env');

/**
 * Run a fetch() call inside the Stealth Go service.
 *
 * @param {string} url
 * @param {object} [opts]
 * @param {string} [opts.method='GET']
 * @param {string} [opts.body]           - Request body (string or JSON string)
 * @param {object} [opts.headers={}]     - Extra headers to merge in
 * @returns {Promise<{ status: number, ok: boolean, text: string }>}
 */
async function browserFetch(url, { method = 'GET', body, headers = {} } = {}) {
  try {
    const payload = {
      url,
      method,
      disableMedia: true,
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        ...headers,
      }
    };
    if (body) payload.postData = body;

    const res = await fetch(`${STEALTH_API_URL}/v1/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn(`[stealthClient] HTTP error from stealth service: ${res.status}`);
      return { status: res.status, ok: false, text: '' };
    }

    const data = await res.json();
    if (data.status !== 'ok' || !data.solution) {
      console.warn(`[stealthClient] Stealth failed to solve:`, data);
      return { status: 500, ok: false, text: '' };
    }

    return {
      status: data.solution.status,
      ok: data.solution.status >= 200 && data.solution.status < 300,
      text: data.solution.response || ''
    };
  } catch (err) {
    console.error(`[stealthClient] Error calling stealth service:`, err.message);
    return { status: 0, ok: false, text: err.message };
  }
}

/**
 * Fetch HTML for a given URL using the Stealth service.
 * @param {string} url
 * @returns {Promise<string>} Full page HTML
 */
async function fetchHtml(url) {
  const res = await browserFetch(url, {
    headers: {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    }
  });
  
  if (!res.ok) {
    console.warn(`[stealthClient] fetchHtml warning: ${res.status} on ${url}`);
  }
  
  return res.text || '';
}

/**
 * Extract the current CF cookies as a header string.
 * Currently stubbed as it may not be necessary with the Stealth service handling cookies.
 */
async function getCookieHeader() {
  return "";
}

/**
 * Tear down the browser. (Stubbed, stealth service runs independently)
 */
async function invalidate() {
  console.log('[stealthClient] invalidate() called - no-op for stealth service');
}

module.exports = { browserFetch, fetchHtml, getCookieHeader, invalidate };
