'use strict';

const cheerio = require('cheerio');
const { BASE_URL } = require('../config/env');

/**
 * Normalize a relative/absolute href into a link object.
 * @private
 */
function normalizeLink(href) {
  if (!href) return null;
  const url = href.startsWith('http') ? href : `${BASE_URL}${href}`;
  return {
    endpoint: href.replace(/^\//, ''),
    url,
  };
}

/**
 * Extract a poster thumbnail from a content card's <img> srcset/src.
 * @private
 */
function extractCardThumbnail($, card) {
  const $img = $(card).find('img').first();
  if (!$img.length) return null;
  // Prefer the largest srcset entry, fall back to src
  const srcset = $img.attr('srcset') || '';
  const src = $img.attr('src') || '';
  if (srcset) {
    const candidates = srcset.split(',').map(s => s.trim().split(' ')[0]);
    if (candidates.length) return candidates[candidates.length - 1];
  }
  return src || null;
}

/**
 * Extract rating and quality badges from a content card.
 * @private
 */
function extractCardMeta($, card) {
  const meta = { rating: null, quality: null, season: null, type: null };

  // Rating: look for the accent-gold number near a star svg
  $(card).find('.text-accent-gold').each((_, el) => {
    const txt = $(el).text().trim();
    const num = parseFloat(txt);
    if (!isNaN(num) && meta.rating === null) meta.rating = num;
  });

  // Quality badge (e.g. WEB-DL)
  const $green = $(card).find('.content-badge--green').first();
  if ($green.length) meta.quality = $green.text().trim();

  // Season badge (e.g. S1, S23)
  const $neutral = $(card).find('.content-badge--neutral').first();
  if ($neutral.length) {
    const t = $neutral.text().trim();
    meta.season = t;
  }

  // Type badge (Movie/TV) - first neutral badge sometimes holds it
  const typeText = $(card).find('.content-badge--neutral').first().text().trim();
  if (/^movie$/i.test(typeText)) meta.type = 'movie';
  else if (/^tv$/i.test(typeText)) meta.type = 'series';

  return meta;
}

/**
 * Parse media items from content cards on a listing page.
 *
 * The new IDLIX Next.js site renders content rows with <a class="content-card">
 * elements containing poster images, ratings, and badges. It also includes a
 * <section class="sr-only"> with plain <ul><li><a> lists as a fallback.
 *
 * @param {string} html - Raw HTML to parse.
 * @param {string} [type] - Filter by media type: 'movie' or 'series'.
 * @returns {Array<Object>} Array of media items with rich metadata.
 */
function parseMediaItems(html, type) {
  const $ = cheerio.load(html);
  const items = [];
  const seen = new Set();

  // 1) Try content cards first (rich data)
  $('a.content-card').each((_, card) => {
    const href = $(card).attr('href') || '';
    if (!href) return;

    const isMovie = href.startsWith('/movie/');
    const isSeries = href.startsWith('/series/');
    if (!isMovie && !isSeries) return;
    if (type === 'movie' && !isMovie) return;
    if (type === 'series' && !isSeries) return;

    const endpoint = href.replace(/^\//, '');
    if (seen.has(endpoint)) return;
    seen.add(endpoint);

    // Title from <h3>, strip trailing year if present for title field
    const $h3 = $(card).find('h3').first();
    const rawTitle = $h3.text().trim() || '';
    let title = rawTitle;
    let year = null;
    const yearMatch = rawTitle.match(/\((\d{4})\)\s*$/);
    if (yearMatch) {
      title = rawTitle.replace(/\s*\(\d{4}\)\s*$/, '').trim();
      year = parseInt(yearMatch[1], 10);
    }

    const meta = extractCardMeta($, card);
    const thumbnail = extractCardThumbnail($, card);

    items.push({
      title,
      year,
      type: meta.type || (isMovie ? 'movie' : 'series'),
      quality: meta.quality,
      rating: meta.rating,
      season: meta.season,
      poster: thumbnail,
      link: normalizeLink(href),
    });
  });

  // 2) Fallback: sr-only lists (no rich metadata)
  if (items.length === 0) {
    $('section.sr-only ul li a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const title = $(el).text().trim();
      if (!title || !href) return;

      const isMovie = href.startsWith('/movie/');
      const isSeries = href.startsWith('/series/');
      if (!isMovie && !isSeries) return;
      if (type === 'movie' && !isMovie) return;
      if (type === 'series' && !isSeries) return;

      const endpoint = href.replace(/^\//, '');
      if (seen.has(endpoint)) return;
      seen.add(endpoint);

      items.push({
        title,
        year: null,
        type: isMovie ? 'movie' : 'series',
        quality: null,
        rating: null,
        season: null,
        poster: null,
        link: normalizeLink(href),
      });
    });
  }

  return items;
}

/**
 * Parse a named section from the homepage.
 *
 * @param {string} html - Raw HTML to parse.
 * @param {string} sectionTitle - Exact text of the <h2> heading.
 * @param {string} [type] - Optional filter: 'movie' or 'series'.
 * @returns {Array<Object>}
 */
function parseHomepageSection(html, sectionTitle, type) {
  const $ = cheerio.load(html);
  const items = [];
  const seen = new Set();

  $('section.sr-only h2').each((_, el) => {
    if ($(el).text().trim() !== sectionTitle) return;

    const $ul = $(el).next('ul');
    $ul.find('li a').each((_, a) => {
      const href = $(a).attr('href') || '';
      const title = $(a).text().trim();
      if (!title || !href) return;

      const isMovie = href.startsWith('/movie/');
      const isSeries = href.startsWith('/series/');
      if (!isMovie && !isSeries) return;
      if (type === 'movie' && !isMovie) return;
      if (type === 'series' && !isSeries) return;

      const endpoint = href.replace(/^\//, '');
      if (seen.has(endpoint)) return;
      seen.add(endpoint);

      items.push({
        title,
        year: null,
        type: isMovie ? 'movie' : 'series',
        quality: null,
        rating: null,
        season: null,
        poster: null,
        link: normalizeLink(href),
      });
    });
  });

  return items;
}

/**
 * Parse all homepage sections into a keyed object.
 *
 * @param {string} html
 * @returns {Object<string, Array>}
 */
function parseHomepageSections(html) {
  const $ = cheerio.load(html);
  const sections = {};

  $('section.sr-only h2').each((_, el) => {
    const title = $(el).text().trim();
    if (!title) return;
    const $ul = $(el).next('ul');
    const items = [];
    $ul.find('li a').each((_, a) => {
      const href = $(a).attr('href') || '';
      const text = $(a).text().trim();
      if (!text || !href) return;
      if (!href.startsWith('/movie/') && !href.startsWith('/series/')) return;
      items.push({
        title: text,
        type: href.startsWith('/movie/') ? 'movie' : 'series',
        link: normalizeLink(href),
      });
    });
    if (items.length) sections[title] = items;
  });

  return sections;
}

/**
 * Parse a browse/listing page (e.g. /movie, /series, /genre/x, /country/x,
 * /year/x, /network/x). Extracts content cards and pagination info.
 *
 * @param {string} html
 * @param {string} [type] - 'movie' | 'series'
 * @returns {{ items: Array, pagination: Object|null }}
 */
function parseBrowsePage(html, type) {
  const $ = cheerio.load(html);
  const items = parseMediaItems(html, type);

  // Pagination: look for Next.js RSC payload or <a> links with page param
  let pagination = null;

  // Try link-based pagination first
  const pageLinks = [];
  $('a[href*="page="]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const m = href.match(/page=(\d+)/);
    if (m) pageLinks.push(parseInt(m[1], 10));
  });

  // Also check Next.js flight data for pagination markers
  const flightData = [];
  $('script').each((_, el) => {
    const txt = $(el).html() || '';
    const matches = txt.match(/"page":\s*(\d+)/g) || [];
    matches.forEach(m => {
      const num = parseInt(m.match(/\d+/)[0], 10);
      pageLinks.push(num);
    });
  });

  if (pageLinks.length) {
    const maxPage = Math.max(...pageLinks);
    pagination = {
      currentPage: 1,
      totalPages: maxPage,
      hasNext: maxPage > 1,
    };
  }

  return { items, pagination };
}

/**
 * Parse a movie/series detail page. Extracts rich metadata from JSON-LD
 * structured data and the visible HTML.
 *
 * @param {string} html
 * @returns {Object} Detail object.
 */
function parseDetail(html) {
  const $ = cheerio.load(html);
  const detail = {
    title: null,
    originalTitle: null,
    year: null,
    releaseDate: null,
    runtime: null,
    runtimeMinutes: null,
    overview: null,
    poster: null,
    backdrop: null,
    logo: null,
    genres: [],
    country: null,
    country_code: null,
    language: null,
    rating: null,
    quality: null,
    type: null,
    director: null,
    cast: [],
    productionCompanies: [],
    trailer: null,
    recommendations: [],
    streamUrl: null,
    link: null,
  };

  // 1) JSON-LD structured data (primary source)
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    if (!raw) return;
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
    const arr = Array.isArray(data) ? data : [data];
    for (const obj of arr) {
      if (!obj || typeof obj !== 'object') continue;
      if (obj['@type'] === 'Movie' || obj['@type'] === 'TVSeries') {
        detail.title = obj.name || detail.title;
        detail.overview = obj.description || detail.overview;
        detail.releaseDate = obj.datePublished || detail.releaseDate;
        if (obj.duration) {
          detail.runtime = obj.duration;
          const m = String(obj.duration).match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
          if (m) {
            const h = parseInt(m[1] || 0, 10);
            const min = parseInt(m[2] || 0, 10);
            detail.runtimeMinutes = h * 60 + min;
          }
        }
        if (Array.isArray(obj.genre)) detail.genres = obj.genre;
        else if (typeof obj.genre === 'string') detail.genres = [obj.genre];
        if (obj.inLanguage) detail.language = obj.inLanguage;
        if (obj.countryOfOrigin && obj.countryOfOrigin.name) {
          detail.country_code = obj.countryOfOrigin.name;
        }
        if (obj.image) {
          const imgs = Array.isArray(obj.image) ? obj.image : [obj.image];
          detail.backdrop = imgs[0] || detail.backdrop;
        }
        if (obj.director) {
          const d = Array.isArray(obj.director) ? obj.director[0] : obj.director;
          if (d && d.name) detail.director = { name: d.name, url: d.url ? normalizeLink(d.url) : null };
        }
        if (Array.isArray(obj.actor)) {
          detail.cast = obj.actor.map(a => ({
            name: a.name,
            character: a.characterName || null,
            url: a.url ? normalizeLink(a.url) : null,
            image: a.image || null,
          }));
        }
        if (Array.isArray(obj.productionCompany)) {
          detail.productionCompanies = obj.productionCompany.map(c => c.name).filter(Boolean);
        }
        if (obj.trailer && obj.trailer.embedUrl) {
          detail.trailer = obj.trailer.embedUrl;
        }
        if (obj.url) detail.link = normalizeLink(obj.url);
        detail.type = obj['@type'] === 'Movie' ? 'movie' : 'series';
      }
    }
  });

  // 2) HTML fallbacks / enrichment
  // Title from <title> tag: "Per Aspera Ad Astra (2026) / IDLIX"
  if (!detail.title) {
    const pageTitle = ($('title').text() || '').split(' / ')[0].trim();
    if (pageTitle) detail.title = pageTitle;
  }

  // Year from title or meta
  if (!detail.year) {
    const m = detail.title && detail.title.match(/\((\d{4})\)/);
    if (m) detail.year = parseInt(m[1], 10);
  }

  // Poster/backdrop from og:image
  if (!detail.backdrop) {
    detail.backdrop = $('meta[property="og:image"]').attr('content') || null;
  }

  // Logo image (the title logo)
  const $logo = $('.detail-content img').first();
  if ($logo.length && !detail.logo) {
    detail.logo = $logo.attr('src') || null;
  }

  // Rating from the accent-gold span near star icon in detail page
  if (detail.rating === null) {
    $('.text-accent-gold').each((_, el) => {
      const txt = $(el).text().trim();
      const num = parseFloat(txt);
      if (!isNaN(num) && detail.rating === null) detail.rating = num;
    });
  }

  // Quality badge
  const $quality = $('.content-badge--green').first();
  if ($quality.length && !detail.quality) {
    detail.quality = $quality.text().trim();
  }

  // Country link
  const $country = $('a[href^="/country/"]').first();
  if ($country.length && !detail.country) {
    detail.country = $country.text().trim();
    const m = ($country.attr('href') || '').match(/\/country\/(.+)/);
    if (m) detail.country_code = m[1];
  }

  // Genres from links
  if (!detail.genres.length) {
    $('a[href^="/genre/"]').each((_, el) => {
      const g = $(el).text().trim();
      if (g && !detail.genres.includes(g)) detail.genres.push(g);
    });
  }

  // Director from "Director :" paragraph
  if (!detail.director) {
    const dirText = $('p:contains("Director")').text();
    const m = dirText.match(/Director\s*:\s*(.+)/);
    if (m) {
      const name = m[1].trim();
      detail.director = { name, url: null };
    }
  }

  // 3) Recommendations ("More Like This")
  const recs = [];
  const seen = new Set();
  $('section a.content-card').each((_, card) => {
    const href = $(card).attr('href') || '';
    if (!href) return;
    if (!href.startsWith('/movie/') && !href.startsWith('/series/')) return;
    const endpoint = href.replace(/^\//, '');
    if (seen.has(endpoint)) return;
    seen.add(endpoint);

    const $h3 = $(card).find('h3').first();
    const rawTitle = $h3.text().trim() || '';
    let title = rawTitle;
    let year = null;
    const yearMatch = rawTitle.match(/\((\d{4})\)\s*$/);
    if (yearMatch) {
      title = rawTitle.replace(/\s*\(\d{4}\)\s*$/, '').trim();
      year = parseInt(yearMatch[1], 10);
    }
    const meta = extractCardMeta($, card);

    recs.push({
      title,
      year,
      type: meta.type || (href.startsWith('/movie/') ? 'movie' : 'series'),
      quality: meta.quality,
      rating: meta.rating,
      season: meta.season,
      poster: extractCardThumbnail($, card),
      link: normalizeLink(href),
    });
  });
  detail.recommendations = recs;

  // 4) Stream URL extraction (best-effort)
  detail.streamUrl = parseStreamUrl(html);

  return detail;
}

/**
 * Best-effort extraction of a stream URL from a detail/player page.
 *
 * The IDLIX player uses Shaka Player with a blob: URL that is generated
 * client-side from an HLS/DASH manifest fetched via an internal API. The
 * manifest URL is not present in the server-rendered HTML; it is fetched
 * after a 5-second wait via an authenticated XHR to a provider endpoint.
 *
 * This function scans the HTML and inline scripts for any direct stream
 * URLs (m3u8, mpd, or mp4) that may be embedded. If none are found, it
 * returns null — the stream URL cannot be reliably obtained without
 * executing the site's JavaScript and passing Cloudflare's challenge.
 *
 * @param {string} html
 * @returns {string|null}
 */
function parseStreamUrl(html) {
  if (!html) return null;

  // Look for direct media URLs in inline scripts or data attributes
  const patterns = [
    /https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i,
    /https?:\/\/[^\s"'<>]+\.mpd[^\s"'<>]*/i,
    /https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/i,
    /["'](https?:\/\/[^\s"'<>]*(?:stream|play|video|media|hls|dash)[^\s"'<>]*)["']/i,
  ];

  for (const p of patterns) {
    const m = html.match(p);
    if (m) {
      const url = m[0].replace(/^["']|["']$/g, '');
      // Filter out obvious non-stream matches (e.g. googleapis cast sender)
      if (/cast_sender|gstatic|googleapis|youtube|cloudflareinsights/.test(url)) continue;
      return url;
    }
  }

  // Check for a data-source or data-src attribute on video/source elements
  const $ = cheerio.load(html);
  const source = $('video source').attr('src') ||
                 $('video').attr('data-src') ||
                 $('[data-player-container] [data-src]').attr('data-src');
  if (source && !source.startsWith('blob:')) return source;

  return null;
}

module.exports = {
  parseMediaItems,
  parseHomepageSection,
  parseHomepageSections,
  parseBrowsePage,
  parseDetail,
  parseStreamUrl,
};