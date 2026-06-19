'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL, BASE_URL } = require('../config/env');
const { parseMediaItems, parseCardItems } = require('../lib/scraper');

/**
 * Fetch and parse Marvel Cinematic Universe movies.
 * @returns {Promise<Array>}
 */
async function getMcu() {
  const key = 'mcu';
  if (cache.isHit(key, CACHE_TTL.mcu)) return cache.get(key);

  const { data } = await httpClient.get('/marvel-cinematic-universe');
  const items = parseCardItems(data, `${BASE_URL}/movie`);
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse trending movies (first page).
 * @returns {Promise<Array>}
 */
async function getTrending() {
  const key = 'trending';
  if (cache.isHit(key, CACHE_TTL.trending)) return cache.get(key);

  const { data } = await httpClient.get('/trending/?get=movies');
  const items = parseMediaItems(data, '.content.right.normal .items.normal > .item.movies');
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse a specific page of trending movies.
 * Throws a 404 error if the page returns no results.
 * @param {number} page
 * @returns {Promise<Array>}
 */
async function getTrendingPage(page) {
  const key = `trending.page.${page}`;
  if (cache.isHit(key, CACHE_TTL.trending)) return cache.get(key);

  const { data } = await httpClient.get(`/trending/page/${page}/?get=movies`);
  const items = parseMediaItems(data, '.content.right.normal .items.normal > .item.movies');

  if (items.length === 0) {
    const err = new Error('Page not found');
    err.status = 404;
    throw err;
  }

  cache.set(key, items);
  return items;
}

module.exports = { getMcu, getTrending, getTrendingPage };
