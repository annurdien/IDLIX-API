'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { parseLeaderboard } = require('../lib/scraper');

/**
 * Fetch and parse the IDLIX leaderboard page (/leaderboard).
 * Returns an array of ranked media items.
 *
 * @returns {Promise<Array>}
 */
async function getLeaderboard() {
  const key = 'leaderboard';
  if (cache.isHit(key, CACHE_TTL.leaderboard)) return cache.get(key);

  const { data } = await httpClient.get('/leaderboard');
  const items = parseLeaderboard(data);
  cache.set(key, items);
  return items;
}

module.exports = { getLeaderboard };
