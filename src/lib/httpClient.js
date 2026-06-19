'use strict';

const cloudscraper = require('cloudscraper');
const { BASE_URL } = require('../config/env');

/**
 * Pre-configured cloudscraper instance.
 *
 * The upstream IDLIX site is now behind Cloudflare's managed challenge,
 * so plain axios requests are blocked with a 403. cloudscraper solves
 * the JS challenge automatically.
 *
 * The exported object exposes a minimal axios-compatible `.get()` API
 * (`url` → `Promise<{ data: string }>`) so that services and tests can
 * use it as a drop-in replacement for the previous axios instance.
 */
const httpClient = {
  /**
   * GET a path on the upstream site.
   * @param {string} path - Path relative to BASE_URL (e.g. "/movie").
   * @returns {Promise<{ data: string }>}
   */
  get(path) {
    const url = `${BASE_URL}${path}`;
    return cloudscraper.get(url).then((data) => ({ data }));
  },
};

module.exports = httpClient;