'use strict';

const cheerio = require('cheerio');
const { BASE_URL } = require('../config/env');

/**
 * Parse media items from a listing page (movie, series, network, genre).
 *
 * The new IDLIX site is a Next.js app whose server-rendered HTML contains
 * a `<section class="sr-only">` with `<ul><li><a>` lists of media links.
 * Links are relative paths like `/movie/slug` or `/series/slug`.
 *
 * @param {string} html - Raw HTML to parse.
 * @param {string} [type] - Filter by media type: 'movie' or 'series'.
 *   If omitted, all media links are returned.
 * @returns {Array<{title: string, link: {endpoint: string, url: string, thumbnail: string|null}}>}
 */
function parseMediaItems(html, type) {
  const $ = cheerio.load(html);
  const items = [];

  $('section.sr-only ul li a').each((_, el) => {
    const href = $(el).attr('href') || '';
    const title = $(el).text().trim();
    if (!title || !href) return;

    // Filter by type when specified
    if (type === 'movie' && !href.startsWith('/movie/')) return;
    if (type === 'series' && !href.startsWith('/series/')) return;
    // Skip non-media links
    if (!href.startsWith('/movie/') && !href.startsWith('/series/')) return;

    const link = {
      endpoint: href.replace(/^\//, ''),
      url: `${BASE_URL}${href}`,
      thumbnail: null, // thumbnails are client-side rendered, not in server HTML
    };

    items.push({ title, link });
  });

  return items;
}

/**
 * Parse a named section from the homepage.
 *
 * The homepage's `section.sr-only` contains multiple `<h2>` + `<ul>` pairs.
 * This function finds the `<h2>` matching `sectionTitle` and extracts the
 * media links from the immediately following `<ul>`.
 *
 * @param {string} html - Raw HTML to parse.
 * @param {string} sectionTitle - Exact text of the `<h2>` heading (e.g. "Trending Now").
 * @param {string} [type] - Optional filter: 'movie' or 'series'.
 * @returns {Array<{title: string, link: {endpoint: string, url: string, thumbnail: string|null}}>}
 */
function parseHomepageSection(html, sectionTitle, type) {
  const $ = cheerio.load(html);
  const items = [];

  $('section.sr-only h2').each((_, el) => {
    if ($(el).text().trim() !== sectionTitle) return;

    const $ul = $(el).next('ul');
    $ul.find('li a').each((_, a) => {
      const href = $(a).attr('href') || '';
      const title = $(a).text().trim();
      if (!title || !href) return;

      // Filter by type when specified
      if (type === 'movie' && !href.startsWith('/movie/')) return;
      if (type === 'series' && !href.startsWith('/series/')) return;
      // Skip non-media links
      if (!href.startsWith('/movie/') && !href.startsWith('/series/')) return;

      const link = {
        endpoint: href.replace(/^\//, ''),
        url: `${BASE_URL}${href}`,
        thumbnail: null,
      };

      items.push({ title, link });
    });
  });

  return items;
}

module.exports = { parseMediaItems, parseHomepageSection };