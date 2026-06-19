'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { parseMediaItems, parseHomepageSection, parseDetail } = require('../lib/scraper');

/**
 * Fetch and parse the main movie browse page.
 * @returns {Promise<Array>}
 */
async function getBrowse() {
  const key = 'movie.browse';
  if (cache.isHit(key, CACHE_TTL.page)) return cache.get(key);

  const { data } = await httpClient.get('/movie');
  const items = parseMediaItems(data, 'movie');
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse the "Collections" section from the homepage.
 * @returns {Promise<Array>}
 */
async function getMcu() {
  const key = 'mcu';
  if (cache.isHit(key, CACHE_TTL.mcu)) return cache.get(key);

  const { data } = await httpClient.get('/');
  const items = parseHomepageSection(data, 'Collections');
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse trending movies from the homepage.
 * @returns {Promise<Array>}
 */
async function getTrending() {
  const key = 'trending';
  if (cache.isHit(key, CACHE_TTL.trending)) return cache.get(key);

  const { data } = await httpClient.get('/');
  const items = parseHomepageSection(data, 'Trending Now', 'movie');
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse a specific page of trending movies.
 * @param {number} page
 * @returns {Promise<Array>}
 */
async function getTrendingPage(page) {
  const key = `trending.page.${page}`;
  if (cache.isHit(key, CACHE_TTL.trending)) return cache.get(key);

  const { data } = await httpClient.get('/movie');
  const items = parseMediaItems(data, 'movie');

  if (items.length === 0 || page > 1) {
    const err = new Error('Page not found');
    err.status = 404;
    throw err;
  }

  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse a movie detail page by slug.
 * Returns rich metadata from JSON-LD structured data.
 *
 * @param {string} slug - e.g. "per-aspera-ad-astra-2026"
 * @returns {Promise<Object>}
 */
async function getDetail(slug) {
  const key = `movie.detail.${slug}`;
  if (cache.isHit(key, CACHE_TTL.detail)) return cache.get(key);

  const { data } = await httpClient.get(`/movie/${slug}`);
  const detail = parseDetail(data);

  if (!detail.title) {
    const err = new Error('Movie not found');
    err.status = 404;
    throw err;
  }

  cache.set(key, detail);
  return detail;
}

/**
 * Extract the stream URL for a movie.
 *
 * Delegates to httpClient.getStreamUrl which:
 *   1. Loads the detail page (no Turnstile)
 *   2. Clicks the play button (client-side navigation)
 *   3. Intercepts HLS/DASH manifest or play-info API responses
 *
 * Results are cached with a short TTL since stream URLs expire.
 *
 * @param {string} slug - e.g. "per-aspera-ad-astra-2026"
 * @returns {Promise<string|null>}
 */
async function getStreamUrl(slug) {
  const key = `movie.stream.${slug}`;
  if (cache.isHit(key, CACHE_TTL.stream)) return cache.get(key);

  const streamUrl = await httpClient.getStreamUrl(`/movie/${slug}?play=1`);
  if (streamUrl) cache.set(key, streamUrl);
  return streamUrl;
}

module.exports = { getBrowse, getMcu, getTrending, getTrendingPage, getDetail, getStreamUrl };