'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { mapApiItem, mapApiDetail } = require('../lib/scraper');

/**
 * Fetch and parse the main movie browse page.
 * @returns {Promise<Array>}
 */
async function getBrowse() {
  const key = 'movie.browse';
  if (cache.isHit(key, CACHE_TTL.page)) return cache.get(key);

  const data = await httpClient.getJson('/api/movies?page=1&limit=36&sort=createdAt');
  const items = (data?.data || []).map(mapApiItem).filter(Boolean);
  
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

  const data = await httpClient.getJson('/api/homepage');
  if (!data) return [];

  const allSections = [...(data.above || []), ...(data.below || [])];
  const section = allSections.find(s => s.title && s.title.toLowerCase().includes('collection'));
  const items = (section?.data || []).map(mapApiItem).filter(Boolean);
  
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

  const data = await httpClient.getJson('/api/homepage');
  if (!data || !data.above) return [];

  const section = data.above.find(s => s.title && s.title.toLowerCase().includes('trending')) || data.above[0];
  const items = (section?.data || []).map(mapApiItem).filter(i => i.type === 'movie');
  
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

  const data = await httpClient.getJson(`/api/movies?page=${page}&limit=36&sort=popularityScore`);
  const items = (data?.data || []).map(mapApiItem).filter(Boolean);


  cache.set(key, items);
  return items;
}

/**
 * Fetch a movie detail page by slug.
 * Returns rich metadata from the native JSON API.
 *
 * @param {string} slug - e.g. "per-aspera-ad-astra-2026"
 * @returns {Promise<Object>}
 */
async function getDetail(slug) {
  const key = `movie.detail.${slug}`;
  if (cache.isHit(key, CACHE_TTL.detail)) return cache.get(key);

  const data = await httpClient.getJson(`/api/movies/${slug}`);
  const detail = mapApiDetail(data);

  if (!detail.title) {
    const err = new Error('Movie not found');
    err.status = 404;
    throw err;
  }

  cache.set(key, detail);
  return detail;
}

/**
 * Fetch the stream data for a movie: URL, subtitles, and metadata.
 *
 * Delegates to httpClient.getStreamData which runs the full API chain:
 *   1. GET /api/movies/{slug}               → content UUID
 *   2. POST /api/views/track                → view counter warm-up
 *   3. GET /api/watch/play-info/movie/{uuid} → gateToken + countdown
 *   4. Wait for countdown
 *   5. POST /api/watch/session/claim        → claim JWT + redeemUrl
 *   6. POST redeemUrl (majorplay.net)       → config URL + subtitles
 *
 * Results are cached with a short TTL since stream URLs expire.
 *
 * @param {string} slug - e.g. "salmokji-whispering-water-2026"
 * @returns {Promise<{
 *   streamUrl:   string | null,
 *   subtitles:   Array<{ lang: string, label: string, url: string }>,
 *   videoId:     string | null,
 *   title:       string | null,
 *   durationSec: number | null,
 *   maxHeight:   number | null,
 *   expiresAt:   number | null,
 * }>}
 */
async function getStreamData(slug) {
  const key = `movie.stream.${slug}`;
  if (cache.isHit(key, CACHE_TTL.stream)) return cache.get(key);

  const result = await httpClient.getStreamData(slug, 'movie');
  if (result.streamUrl) cache.set(key, result);
  return result;
}

module.exports = { getBrowse, getMcu, getTrending, getTrendingPage, getDetail, getStreamData };