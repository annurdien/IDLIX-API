'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { parseMediaItems, parseHomepageSection } = require('../lib/scraper');

/**
 * Fetch and parse trending TV series from the homepage.
 * The new site's "Trending Now" section includes both movies and series;
 * we filter to series only.
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
 * This replaces the old Marvel Studios series endpoint — the new site
 * no longer has a dedicated Marvel page, but "Network Originals" serves
 * as a curated series collection.
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
 *
 * The new site does not support pagination on network pages.
 * Page 1 returns the Netflix listing; pages beyond 1 throw a 404.
 *
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

module.exports = {
  getTrending,
  getMarvelSeries,
  getAppleTv,
  getDisneyPlus,
  getHboSeries,
  getNetflixSeries,
  getNetflixSeriesPage,
};