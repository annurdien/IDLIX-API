'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { parseHomepageSection } = require('../lib/scraper');

/**
 * Fetch and parse featured movies from the IDLIX homepage.
 *
 * The new site's homepage has a "Trending Now" section which serves as
 * the equivalent of the old "featured" section.
 * Results are cached for CACHE_TTL.featured hours.
 * @returns {Promise<Array>}
 */
async function getFeatured() {
  const key = 'featured';
  if (cache.isHit(key, CACHE_TTL.featured)) return cache.get(key);

  const { data } = await httpClient.get('/');
  const items = parseHomepageSection(data, 'Trending Now');
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse recently added movies from the IDLIX homepage.
 *
 * The new site's homepage has a "Recently Added Movies" section which
 * serves as the equivalent of the old "Cinema XXI" section.
 * Results are cached for CACHE_TTL.cinemaxxi hours.
 * @returns {Promise<Array>}
 */
async function getCinemaxxi() {
  const key = 'cinemaxxi';
  if (cache.isHit(key, CACHE_TTL.cinemaxxi)) return cache.get(key);

  const { data } = await httpClient.get('/');
  const items = parseHomepageSection(data, 'Recently Added Movies', 'movie');
  cache.set(key, items);
  return items;
}

module.exports = { getFeatured, getCinemaxxi };