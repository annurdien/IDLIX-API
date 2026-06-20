'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { mapApiItem } = require('../lib/scraper');

/**
 * Fetch and parse TV series for a given genre and page.
 *
 * @param {string} genre
 * @param {number} [page=1]
 * @returns {Promise<Array>}
 */
async function getGenreSeries(genre, page = 1) {
  const key = `page.series.${genre}.${page}`;
  if (cache.isHit(key, CACHE_TTL.page)) return cache.get(key);

  const data = await httpClient.getJson(`/api/series?genre=${genre}&page=${page}&limit=36&sort=createdAt`);
  const items = (data?.data || []).map(mapApiItem).filter(Boolean);

  if (items.length === 0 && page > 1) {
    const err = new Error('Page not found');
    err.status = 404;
    throw err;
  }

  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse movies for a given genre and page.
 *
 * @param {string} genre
 * @param {number} [page=1]
 * @returns {Promise<Array>}
 */
async function getGenreMovie(genre, page = 1) {
  const key = `page.movie.${genre}.${page}`;
  if (cache.isHit(key, CACHE_TTL.page)) return cache.get(key);

  const data = await httpClient.getJson(`/api/movies?genre=${genre}&page=${page}&limit=36&sort=createdAt`);
  const items = (data?.data || []).map(mapApiItem).filter(Boolean);

  if (items.length === 0 && page > 1) {
    const err = new Error('Page not found');
    err.status = 404;
    throw err;
  }

  cache.set(key, items);
  return items;
}

module.exports = { getGenreSeries, getGenreMovie };