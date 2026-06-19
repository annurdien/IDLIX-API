'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { parseMediaItems } = require('../lib/scraper');

/**
 * Fetch and parse TV series for a given genre and page.
 * @param {string} genre
 * @param {number} [page=1]
 * @returns {Promise<Array>}
 */
async function getGenreSeries(genre, page = 1) {
  const key = `page.series.${genre}.${page}`;
  if (cache.isHit(key, CACHE_TTL.page)) return cache.get(key);

  const { data } = await httpClient.get(`/genre/${genre}/page/${page}`);
  const items = parseMediaItems(data, '.items.normal > .item.tvshows');
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse movies for a given genre and page.
 * @param {string} genre
 * @param {number} [page=1]
 * @returns {Promise<Array>}
 */
async function getGenreMovie(genre, page = 1) {
  const key = `page.movie.${genre}.${page}`;
  if (cache.isHit(key, CACHE_TTL.page)) return cache.get(key);

  const { data } = await httpClient.get(`/genre/${genre}/page/${page}`);
  const items = parseMediaItems(data, '.items.normal > .item.movies');
  cache.set(key, items);
  return items;
}

module.exports = { getGenreSeries, getGenreMovie };
