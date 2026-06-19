'use strict';

const fs   = require('fs');
const path = require('path');

const {
  parseMediaItems,
  parseCardItems,
  parseFeaturedItems,
  parseCinemaxxiItems,
} = require('../../src/lib/scraper');

const FIXTURES = path.join(__dirname, '../fixtures');
const read = (name) => fs.readFileSync(path.join(FIXTURES, name), 'utf-8');

// ── parseMediaItems ──────────────────────────────────────────────────────────

describe('parseMediaItems', () => {
  const trendingHtml = read('trending.html');
  const genreHtml    = read('genre.html');

  it('extracts movie items from a trending page', () => {
    const items = parseMediaItems(
      trendingHtml,
      '.content.right.normal .items.normal > .item.movies',
    );
    expect(items).toHaveLength(2); // third item has no alt — filtered
    expect(items[0]).toMatchObject({
      title: 'Trending Movie 1',
      link: {
        endpoint: 'movie/trending-movie-1/',
        url:      'https://185.231.223.71/movie/trending-movie-1/',
        thumbnail: 'https://img.example.com/t1.jpg',
      },
    });
    expect(items[1].title).toBe('Trending Movie 2');
  });

  it('extracts movie items from a genre page', () => {
    const items = parseMediaItems(genreHtml, '.items.normal > .item.movies');
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Action Movie 1');
  });

  it('extracts tvshow items from a genre page', () => {
    const items = parseMediaItems(genreHtml, '.items.normal > .item.tvshows');
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Action Series 1');
  });

  it('returns an empty array when no matching elements are found', () => {
    expect(parseMediaItems('<div></div>', '.nonexistent > .item')).toEqual([]);
  });

  it('skips items that have no alt attribute (title)', () => {
    const html = `
      <div class="items normal">
        <div class="item movies">
          <div class="poster">
            <a href="https://185.231.223.71/movie/no-alt/"></a>
            <img data-src="https://img.example.com/noalt.jpg"/>
          </div>
        </div>
      </div>`;
    expect(parseMediaItems(html, '.items.normal > .item.movies')).toEqual([]);
  });

  it('handles missing href gracefully (sets empty string)', () => {
    const html = `
      <div class="items normal">
        <div class="item movies">
          <div class="poster">
            <a></a>
            <img alt="No Href Movie" data-src="https://img.example.com/nohref.jpg"/>
          </div>
        </div>
      </div>`;
    const items = parseMediaItems(html, '.items.normal > .item.movies');
    expect(items).toHaveLength(1);
    expect(items[0].link.url).toBe('');
  });
});

// ── parseCardItems ───────────────────────────────────────────────────────────

describe('parseCardItems', () => {
  const cardsHtml = read('cards.html');

  it('extracts card items and constructs URL from prefix + href', () => {
    const items = parseCardItems(cardsHtml, 'https://185.231.223.71/movie');
    expect(items).toHaveLength(2); // third card has no href — filtered
    expect(items[0]).toMatchObject({
      title: 'MCU Movie 1',
      link: {
        endpoint: '/mcu-movie-1/',
        url:      'https://185.231.223.71/movie/mcu-movie-1/',
        thumbnail: 'https://img.example.com/mcu1.jpg',
      },
    });
  });

  it('filters out cards without an href attribute', () => {
    const items = parseCardItems(cardsHtml, 'https://185.231.223.71/movie');
    const found = items.find((i) => i.title === 'No Link Movie');
    expect(found).toBeUndefined();
  });

  it('returns an empty array for HTML without the expected structure', () => {
    expect(parseCardItems('<div></div>', 'https://example.com')).toEqual([]);
  });

  it('uses the tvseries prefix correctly', () => {
    const items = parseCardItems(cardsHtml, 'https://185.231.223.71/tvseries');
    expect(items[0].link.url).toBe('https://185.231.223.71/tvseries/mcu-movie-1/');
  });
});

// ── parseFeaturedItems ───────────────────────────────────────────────────────

describe('parseFeaturedItems', () => {
  const homepageHtml = read('homepage.html');

  it('extracts featured items with correct endpoint stripping', () => {
    const items = parseFeaturedItems(homepageHtml);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: 'Featured Movie 1',
      link: {
        endpoint:  'featured-movie-1/',
        url:       'https://185.231.223.71/movie/featured-movie-1/',
        thumbnail: 'https://img.example.com/f1.jpg',
      },
    });
  });

  it('returns an empty array for HTML without featured items', () => {
    expect(parseFeaturedItems('<div></div>')).toEqual([]);
  });
});

// ── parseCinemaxxiItems ──────────────────────────────────────────────────────

describe('parseCinemaxxiItems', () => {
  const homepageHtml = read('homepage.html');

  it('extracts cinemaxxi items from the .items.normal section', () => {
    const items = parseCinemaxxiItems(homepageHtml);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: 'Cinema Movie 1',
      link: {
        endpoint:  'cinema-movie-1/',
        url:       'https://185.231.223.71/movie/cinema-movie-1/',
        thumbnail: 'https://img.example.com/c1.jpg',
      },
    });
  });

  it('returns an empty array for HTML without .items.normal movies', () => {
    expect(parseCinemaxxiItems('<div class="items normal"></div>')).toEqual([]);
  });
});
