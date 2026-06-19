'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { parseFeaturedItems, parseCinemaxxiItems } = require('../lib/scraper');

/**
 * Fetch and parse featured movies from the IDLIX homepage.
 * Results are cached for CACHE_TTL.featured hours.
 * @returns {Promise<Array>}
 */
async function getFeatured() {
  const key = 'featured';
  if (cache.isHit(key, CACHE_TTL.featured)) return cache.get(key);

  const { data } = await httpClient.get('/');
  const items = parseFeaturedItems(data);
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse Cinema XXI movies from the IDLIX homepage.
 * Results are cached for CACHE_TTL.cinemaxxi hours.
 * @returns {Promise<Array>}
 */
async function getCinemaxxi() {
  const key = 'cinemaxxi';
  if (cache.isHit(key, CACHE_TTL.cinemaxxi)) return cache.get(key);

  const { data } = await httpClient.get('/');
  const items = parseCinemaxxiItems(data);
  cache.set(key, items);
  return items;
}

module.exports = { getFeatured, getCinemaxxi };
