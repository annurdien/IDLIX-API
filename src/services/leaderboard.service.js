'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { mapApiItem } = require('../lib/scraper');

/**
 * Fetch the IDLIX leaderboard from the native JSON API.
 * Returns an object containing multiple leaderboard categories.
 *
 * @returns {Promise<Object>}
 */
async function getLeaderboard() {
  const key = 'leaderboard';
  if (cache.isHit(key, CACHE_TTL.leaderboard)) return cache.get(key);

  const data = await httpClient.getJson('/api/leaderboard');
  
  if (!data) return {};

  const items = {
    month: data.month,
    updatedAt: data.updatedAt,
    topMovies: (data.topMovies || []).map(mapApiItem),
    topSeries: (data.topSeries || []).map(mapApiItem),
    topWatchlisted: (data.topWatchlisted || []).map(mapApiItem),
    topFavourited: (data.topFavourited || []).map(mapApiItem),
    // Pass through reviews and comments directly if they exist
    topReviews: data.topReviews || [],
    topComments: data.topComments || []
  };

  cache.set(key, items);
  return items;
}

module.exports = { getLeaderboard };
