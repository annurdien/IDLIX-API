'use strict';

const httpClient = require('../lib/httpClient');
const cache      = require('../lib/cacheService');
const { CACHE_TTL } = require('../config/env');
const { parseHomepageSection, parseHomepageSections, parseMediaItems } = require('../lib/scraper');

/**
 * Fetch and parse featured movies from the IDLIX homepage.
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

/**
 * Fetch and return all homepage content as a flat array of items.
 * Combines Trending Now, Recently Added Movies, and Network Originals sections.
 * @returns {Promise<Array>}
 */
async function getHome() {
  const key = 'home.all';
  if (cache.isHit(key, CACHE_TTL.home)) return cache.get(key);

  const { data } = await httpClient.get('/');
  const items = parseMediaItems(data, null);
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

  const { data } = await httpClient.get('/');
  const sections = parseHomepageSections(data);
  cache.set(key, sections);
  return sections;
}

module.exports = { getFeatured, getCinemaxxi, getHome, getHomeSections };