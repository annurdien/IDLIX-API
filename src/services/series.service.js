'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL, BASE_URL } = require('../config/env');
const { parseMediaItems, parseCardItems } = require('../lib/scraper');

/**
 * Fetch and parse trending TV series.
 * @returns {Promise<Array>}
 */
async function getTrending() {
  const key = 'trending.tv';
  if (cache.isHit(key, CACHE_TTL.trending)) return cache.get(key);

  const { data } = await httpClient.get('/trending/?get=tv');
  const items = parseMediaItems(data, '.content.right.normal .items.normal > .item.tvshows');
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse Marvel Studios series.
 * @returns {Promise<Array>}
 */
async function getMarvelSeries() {
  const key = 'marvelseries';
  if (cache.isHit(key, CACHE_TTL.series)) return cache.get(key);

  const { data } = await httpClient.get('/marvel-studios-series');
  const items = parseCardItems(data, `${BASE_URL}/tvseries`);
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

  const { data } = await httpClient.get('/network/apple-tv');
  const items = parseMediaItems(data, '.items.normal > .item.tvshows');
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

  const { data } = await httpClient.get('/network/disney');
  const items = parseMediaItems(data, '.items.normal > .item.tvshows');
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

  const { data } = await httpClient.get('/network/HBO');
  const items = parseMediaItems(data, '.items.normal > .item.tvshows');
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
  const items = parseMediaItems(data, '.items.normal > .item.tvshows');
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

  const { data } = await httpClient.get(`/network/netflix/page/${page}/`);
  const items = parseMediaItems(data, '.items.normal > .item.tvshows');
  cache.set(key, items);
  return items;
}

module.exports = {
  getTrending,
  getMarvelSeries,
  getAppleTv,
  getDisneyPlus,
  getHboSeries,
  getNetflixSeries,
  getNetflixSeriesPage,
};
