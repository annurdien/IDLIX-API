'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { parseMediaItems, parseHomepageSection } = require('../lib/scraper');

/**
 * Fetch and parse the "Collections" section from the homepage.
 * This replaces the old MCU endpoint — the new site no longer has a
 * dedicated Marvel Cinematic Universe page, but the homepage "Collections"
 * section serves as a curated collection equivalent.
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
 * The new site's "Trending Now" section includes both movies and series;
 * we filter to movies only.
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
 *
 * The new site does not support pagination on listing pages.
 * Page 1 returns the movie listing; pages beyond 1 throw a 404.
 *
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

module.exports = { getMcu, getTrending, getTrendingPage };