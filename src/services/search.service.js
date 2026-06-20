'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { mapApiItem } = require('../lib/scraper');

/**
 * Search movies and series on the IDLIX site.
 *
 * @param {string} query - Search term.
 * @returns {Promise<Array>}
 */
async function search(query) {
  // Normalise to prevent cache pollution from trivial differences
  const normalisedQuery = query.trim().toLowerCase();
  const key = `search.${normalisedQuery}`;
  if (cache.isHit(key, CACHE_TTL.search)) return cache.get(key);

  const encodedQuery = encodeURIComponent(query.trim());
  const data = await httpClient.getJson(`/api/search?q=${encodedQuery}`);
  
  const items = (data?.results || []).map(mapApiItem).filter(Boolean);
  
  cache.set(key, items);
  return items;
}

module.exports = { search };
