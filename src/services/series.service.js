'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { parseMediaItems, parseHomepageSection, parseDetail } = require('../lib/scraper');

/**
 * Fetch and parse the main TV series browse page.
 * @returns {Promise<Array>}
 */
async function getBrowse() {
  const key = 'series.browse';
  if (cache.isHit(key, CACHE_TTL.page)) return cache.get(key);

  const { data } = await httpClient.get('/series');
  const items = parseMediaItems(data, 'series');
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse trending TV series from the homepage.
 * @returns {Promise<Array>}
 */
async function getTrending() {
  const key = 'trending.tv';
  if (cache.isHit(key, CACHE_TTL.trending)) return cache.get(key);

  const { data } = await httpClient.get('/');
  const items = parseHomepageSection(data, 'Trending Now', 'series');
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse the "Network Originals" section from the homepage.
 * @returns {Promise<Array>}
 */
async function getMarvelSeries() {
  const key = 'marvelseries';
  if (cache.isHit(key, CACHE_TTL.series)) return cache.get(key);

  const { data } = await httpClient.get('/');
  const items = parseHomepageSection(data, 'Network Originals', 'series');
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse Apple TV+ series.
 * @returns {Promise<Array>}
 */
async function getAppleTv() {
  const key = 'appletvseries';
  if (cache.isHit(key, CACHE_TTL.series)) return cache.get(key);

  const { data } = await httpClient.get('/network/apple-tv-plus');
  const items = parseMediaItems(data, 'series');
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse Disney+ series.
 * @returns {Promise<Array>}
 */
async function getDisneyPlus() {
  const key = 'disneyplusseries';
  if (cache.isHit(key, CACHE_TTL.series)) return cache.get(key);

  const { data } = await httpClient.get('/network/disney-plus');
  const items = parseMediaItems(data, 'series');
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse HBO series.
 * @returns {Promise<Array>}
 */
async function getHboSeries() {
  const key = 'hboseries';
  if (cache.isHit(key, CACHE_TTL.series)) return cache.get(key);

  const { data } = await httpClient.get('/network/hbo');
  const items = parseMediaItems(data, 'series');
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse Netflix series (page 1).
 * @returns {Promise<Array>}
 */
async function getNetflixSeries() {
  const key = 'netflixseries';
  if (cache.isHit(key, CACHE_TTL.series)) return cache.get(key);

  const { data } = await httpClient.get('/network/netflix');
  const items = parseMediaItems(data, 'series');
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse a specific page of Netflix series.
 * @param {number} page
 * @returns {Promise<Array>}
 */
async function getNetflixSeriesPage(page) {
  const key = `netflixseries.page.${page}`;
  if (cache.isHit(key, CACHE_TTL.series)) return cache.get(key);

  const { data } = await httpClient.get('/network/netflix');
  const items = parseMediaItems(data, 'series');

  if (items.length === 0 || page > 1) {
    const err = new Error('Page not found');
    err.status = 404;
    throw err;
  }

  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse a series detail page by slug.
 * Returns rich metadata from JSON-LD structured data.
 *
 * @param {string} slug - e.g. "the-last-of-us-2023"
 * @returns {Promise<Object>}
 */
async function getDetail(slug) {
  const key = `series.detail.${slug}`;
  if (cache.isHit(key, CACHE_TTL.detail)) return cache.get(key);

  const { data } = await httpClient.get(`/series/${slug}`);
  const detail = parseDetail(data);

  if (!detail.title) {
    const err = new Error('Series not found');
    err.status = 404;
    throw err;
  }

  cache.set(key, detail);
  return detail;
}

/**
 * Fetch the stream data for a series episode: URL, subtitles, and metadata.
 *
 * Delegates to httpClient.getStreamData which runs the full API chain.
 * Results are cached with a short TTL since stream URLs expire.
 *
 * @param {string} slug - e.g. "the-last-of-us-2023"
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
  const key = `series.stream.${slug}`;
  if (cache.isHit(key, CACHE_TTL.stream)) return cache.get(key);

  const result = await httpClient.getStreamData(slug, 'series');
  if (result.streamUrl) cache.set(key, result);
  return result;
}

/**
 * Fetch stream data for a specific series episode.
 *
 * @param {string} slug    - e.g. "oasis-2026"
 * @param {number} season  - Season number (1-based)
 * @param {number} episode - Episode number (1-based)
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
async function getEpisodeStreamData(slug, season, episode) {
  const key = `series.stream.${slug}.s${season}e${episode}`;
  if (cache.isHit(key, CACHE_TTL.stream)) return cache.get(key);

  const result = await httpClient.getEpisodeStreamData(slug, Number(season), Number(episode));
  if (result.streamUrl) cache.set(key, result);
  return result;
}

module.exports = {
  getBrowse,
  getTrending,
  getMarvelSeries,
  getAppleTv,
  getDisneyPlus,
  getHboSeries,
  getNetflixSeries,
  getNetflixSeriesPage,
  getDetail,
  getStreamData,
  getEpisodeStreamData,
};