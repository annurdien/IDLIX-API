'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { mapApiItem } = require('../lib/scraper');

/**
 * Fetch and parse featured movies from the IDLIX homepage.
 * Results are cached for CACHE_TTL.featured hours.
 * @returns {Promise<Array>}
 */
async function getFeatured() {
  const key = 'featured';
  if (cache.isHit(key, CACHE_TTL.featured)) return cache.get(key);

  const data = await httpClient.getJson('/api/homepage');
  if (!data || !data.above) return [];
  
  const section = data.above.find(s => s.title && s.title.toLowerCase().includes('featured')) || data.above[0];
  const items = (section?.data || []).map(mapApiItem).filter(Boolean);
  
  cache.set(key, items);
  return items;
}

/**
 * Fetch and parse recently added movies from the IDLIX homepage.
 * Results are cached for CACHE_TTL.cinemaxxi hours.
 * @returns {Promise<Array>}
 */
async function getCinemaxxi() {
  const key = 'cinemaxxi';
  if (cache.isHit(key, CACHE_TTL.cinemaxxi)) return cache.get(key);

  const data = await httpClient.getJson('/api/homepage');
  if (!data || !data.above) return [];

  const section = data.above.find(s => s.title && s.title.toLowerCase().includes('recently added movies')) || data.above[1];
  const items = (section?.data || []).map(mapApiItem).filter(Boolean);
  
  cache.set(key, items);
  return items;
}

/**
 * Fetch and return all homepage content as a flat array of items.
 * Combines Trending Now, Recently Added Movies, and Network Originals sections.
 * @returns {Promise<Array>}
 */
async function getHome() {
  const key = 'home.all';
  if (cache.isHit(key, CACHE_TTL.home)) return cache.get(key);

  const data = await httpClient.getJson('/api/homepage');
  if (!data) return [];

  const allSections = [...(data.above || []), ...(data.below || [])];
  const items = allSections.flatMap(s => (s.data || []).map(mapApiItem)).filter(Boolean);
  
  cache.set(key, items);
  return items;
}

/**
 * Fetch and return homepage content organised by section name.
 * Returns an object keyed by section title (e.g. "Trending Now", "Recently Added Movies").
 * @returns {Promise<Object>}
 */
async function getHomeSections() {
  const key = 'home.sections';
  if (cache.isHit(key, CACHE_TTL.home)) return cache.get(key);

  const data = await httpClient.getJson('/api/homepage');
  if (!data) return {};

  const sections = {};
  const allSections = [...(data.above || []), ...(data.below || [])];
  
  for (const s of allSections) {
    if (!s.title) continue;
    const items = (s.data || []).map(mapApiItem).filter(Boolean);
    if (items.length) {
      sections[s.title] = items;
    }
  }

  cache.set(key, sections);
  return sections;
}

module.exports = { getFeatured, getCinemaxxi, getHome, getHomeSections };