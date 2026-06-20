'use strict';

const httpClient = require('../lib/httpClient');
const cache = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { parseCategoryItems, mapApiItem } = require('../lib/scraper');

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
  if (cache.isHit(key, CACHE_TTL.page)) return cache.get(key);

  const isSeries = type === 'series';
  const apiPath = isSeries ? '/api/series' : '/api/movies';
  
  // The API uses query params matching the category name (e.g., ?country=us)
  const qs = `${category}=${value}&page=${page}&limit=36&sort=createdAt`;
  
  const data = await httpClient.getJson(`${apiPath}?${qs}`);
  const items = (data?.data || []).map(mapApiItem).filter(Boolean);

  if (items.length === 0 && page > 1) {
    const err = new Error('Page not found');
    err.status = 404;
    throw err;
  }

  cache.set(key, items);
  return items;
}

module.exports = {
  getCategoryIndex,
  getCategoryBrowse,
};
