'use strict';

const httpClient = require('../lib/httpClient');
const cache = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { parseCategoryItems, parseMediaItems } = require('../lib/scraper');

function buildKey(parts) {
  return parts.filter(Boolean).join('.');
}

async function fetchWithCache(key, ttl, path, parser) {
  if (cache.isHit(key, ttl)) return cache.get(key);

  const { data } = await httpClient.get(path);
  const items = parser(data);
  cache.set(key, items);
  return items;
}

async function getCategoryIndex(category) {
  const key = buildKey([category, 'index']);
  return fetchWithCache(key, CACHE_TTL.page, `/${category}`, data => parseCategoryItems(data, category));
}

async function getCategoryBrowse(category, value, type, page = 1) {
  const key = buildKey([category, value, type || 'all', `page-${page}`]);
  return fetchWithCache(key, CACHE_TTL.page, `/${category}/${value}`, (data) => {
    if (page > 1) {
      const err = new Error('Page not found');
      err.status = 404;
      throw err;
    }

    return parseMediaItems(data, type || undefined);
  });
}

module.exports = {
  getCategoryIndex,
  getCategoryBrowse,
};
