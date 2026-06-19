'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { parseMediaItems } = require('../lib/scraper');

/**
 * Fetch and parse TV series for a given genre and page.
 *
 * The new site's genre pages combine movies and series in a single listing.
 * We filter to series only. Pagination is not supported by the new site;
 * page 1 returns results, pages beyond 1 throw a 404.
 *
 * @param {string} genre
 * @param {number} [page=1]
 * @returns {Promise<Array>}
 */
async function getGenreSeries(genre, page = 1) {
  const key = `page.series.${genre}.${page}`;
  if (cache.isHit(key, CACHE_TTL.page)) return cache.get(key);

  const { data } = await httpClient.get(`/genre/${genre}`);
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
 * Fetch and parse movies for a given genre and page.
 *
 * The new site's genre pages combine movies and series in a single listing.
 * We filter to movies only. Pagination is not supported by the new site;
 * page 1 returns results, pages beyond 1 throw a 404.
 *
 * @param {string} genre
 * @param {number} [page=1]
 * @returns {Promise<Array>}
 */
async function getGenreMovie(genre, page = 1) {
  const key = `page.movie.${genre}.${page}`;
  if (cache.isHit(key, CACHE_TTL.page)) return cache.get(key);

  const { data } = await httpClient.get(`/genre/${genre}`);
  const items = parseMediaItems(data, 'movie');

  if (items.length === 0 || page > 1) {
    const err = new Error('Page not found');
    err.status = 404;
    throw err;
  }

  cache.set(key, items);
  return items;
}

module.exports = { getGenreSeries, getGenreMovie };