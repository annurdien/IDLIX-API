'use strict';

const cheerio = require('cheerio');
const { BASE_URL } = require('../config/env');

/**
 * Parse a standard media grid of movie/TV-show cards.
 * Each item must have a `.poster > a` (link anchor) and `.poster > img` (alt + data-src).
 *
 * @param {string} html - Raw HTML to parse.
 * @param {string} itemSelector - Full CSS selector targeting every individual card element.
 * @returns {Array<{title: string, link: {endpoint: string, url: string, thumbnail: string|null}}>}
 */
function parseMediaItems(html, itemSelector) {
  const $ = cheerio.load(html);
  const items = [];

  $(itemSelector).each((_, el) => {
    const title = $(el).find('.poster > img').attr('alt');
    if (!title) return; // skip items missing an alt/title

    const href = $(el).find('.poster > a').attr('href') || '';
    const link = {
      endpoint: href.replace(`${BASE_URL}/`, ''),
      url: href,
      thumbnail: $(el).find('.poster > img').attr('data-src') || null,
    };

    items.push({ title, link });
  });

  return items;
}

/**
 * Parse a card-style grid used on curated collection pages (MCU, Marvel Studios series).
 * Each item must match: `.single-page .wp-content > .row > .column .card > a`
 *
 * @param {string} html - Raw HTML to parse.
 * @param {string} urlPrefix - Prefix prepended to relative hrefs to form absolute URLs.
 * @returns {Array<{title: string, link: {endpoint: string, url: string, thumbnail: string|null}}>}
 */
function parseCardItems(html, urlPrefix) {
  const $ = cheerio.load(html);
  const items = [];

  $('.single-page .wp-content > .row > .column').each((_, el) => {
    const title = $(el).find('.card > a').attr('title');
    const href  = $(el).find('.card > a').attr('href');
    if (!href || !title) return; // skip placeholder / empty cards

    const link = {
      endpoint: href,
      url: `${urlPrefix}${href}`,
      thumbnail: $(el).find('.card > a > img').attr('src') || null,
    };

    items.push({ title, link });
  });

  return items;
}

/**
 * Parse the featured-movies section from the homepage.
 * Expects `.items.featured .item.movies` with `.data.dfeatur > h3 > a` link.
 *
 * @param {string} html - Raw HTML to parse.
 * @returns {Array<{title: string, link: {endpoint: string, url: string, thumbnail: string|null}}>}
 */
function parseFeaturedItems(html) {
  const $ = cheerio.load(html);
  const items = [];

  $('.items.featured .item.movies').each((_, el) => {
    const title = $(el).find('.poster > img').attr('alt');
    if (!title) return;

    const href = $(el).find('.data.dfeatur > h3 > a').attr('href') || '';
    const link = {
      endpoint: href.replace(`${BASE_URL}/movie/`, ''),
      url: href,
      thumbnail: $(el).find('.poster > img').attr('data-src') || null,
    };

    items.push({ title, link });
  });

  return items;
}

/**
 * Parse the Cinema XXI section from the homepage.
 * Expects `.items.normal .item.movies` with `.data > h3 > a` link.
 *
 * @param {string} html - Raw HTML to parse.
 * @returns {Array<{title: string, link: {endpoint: string, url: string, thumbnail: string|null}}>}
 */
function parseCinemaxxiItems(html) {
  const $ = cheerio.load(html);
  const items = [];

  $('.items.normal .item.movies').each((_, el) => {
    const title = $(el).find('.poster > img').attr('alt');
    if (!title) return;

    const href = $(el).find('.data > h3 > a').attr('href') || '';
    const link = {
      endpoint: href.replace(`${BASE_URL}/movie/`, ''),
      url: href,
      thumbnail: $(el).find('.poster > img').attr('data-src') || null,
    };

    items.push({ title, link });
  });

  return items;
}

module.exports = { parseMediaItems, parseCardItems, parseFeaturedItems, parseCinemaxxiItems };
