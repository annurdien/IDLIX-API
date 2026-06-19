'use strict';

const fs   = require('fs');
const path = require('path');

const {
  parseMediaItems,
  parseHomepageSection,
} = require('../../src/lib/scraper');

const FIXTURES = path.join(__dirname, '../fixtures');
const read = (name) => fs.readFileSync(path.join(FIXTURES, name), 'utf-8');

// ── parseMediaItems ──────────────────────────────────────────────────────────

describe('parseMediaItems', () => {
  const trendingHtml = read('trending.html');
  const genreHtml    = read('genre.html');
  const networkHtml  = read('network.html');

  it('extracts movie items from a movie listing page', () => {
    const items = parseMediaItems(trendingHtml, 'movie');
    expect(items).toHaveLength(2); // third item has empty text — filtered
    expect(items[0]).toMatchObject({
      title: 'Trending Movie 1',
      link: {
        endpoint: 'movie/trending-movie-1',
        url:      'https://z2.idlixku.com/movie/trending-movie-1',
        thumbnail: null,
      },
    });
    expect(items[1].title).toBe('Trending Movie 2');
  });

  it('extracts movie items from a genre page', () => {
    const items = parseMediaItems(genreHtml, 'movie');
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Action Movie 1');
  });

  it('extracts tvshow items from a genre page', () => {
    const items = parseMediaItems(genreHtml, 'series');
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Action Series 1');
  });

  it('extracts series items from a network page', () => {
    const items = parseMediaItems(networkHtml, 'series');
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('Test Series 1');
    expect(items[1].title).toBe('Test Series 2');
  });

  it('extracts all media items when no type filter is given', () => {
    const items = parseMediaItems(networkHtml);
    expect(items).toHaveLength(4);
  });

  it('returns an empty array when no matching elements are found', () => {
    expect(parseMediaItems('<div></div>', 'movie')).toEqual([]);
  });

  it('skips items that have no text (title)', () => {
    const html = `
      <section class="sr-only">
        <ul>
          <li><a href="/movie/no-text"></a></li>
          <li><a href="/movie/has-text">Has Text</a></li>
        </ul>
      </section>`;
    const items = parseMediaItems(html, 'movie');
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Has Text');
  });

  it('skips non-media links', () => {
    const html = `
      <section class="sr-only">
        <ul>
          <li><a href="/leaderboard">Leaderboard</a></li>
          <li><a href="/movie/real-movie">Real Movie</a></li>
        </ul>
      </section>`;
    const items = parseMediaItems(html, 'movie');
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Real Movie');
  });
});

// ── parseHomepageSection ─────────────────────────────────────────────────────

describe('parseHomepageSection', () => {
  const homepageHtml = read('homepage.html');

  it('extracts items from the "Trending Now" section', () => {
    const items = parseHomepageSection(homepageHtml, 'Trending Now');
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      title: 'Teach You a Lesson',
      link: {
        endpoint: 'series/teach-you-a-lesson-2026',
        url:      'https://z2.idlixku.com/series/teach-you-a-lesson-2026',
        thumbnail: null,
      },
    });
  });

  it('filters to movies only when type is "movie"', () => {
    const items = parseHomepageSection(homepageHtml, 'Trending Now', 'movie');
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Salmokji: Whispering Water');
  });

  it('filters to series only when type is "series"', () => {
    const items = parseHomepageSection(homepageHtml, 'Trending Now', 'series');
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('Teach You a Lesson');
  });

  it('extracts items from the "Recently Added Movies" section', () => {
    const items = parseHomepageSection(homepageHtml, 'Recently Added Movies', 'movie');
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('Per Aspera Ad Astra');
  });

  it('extracts items from the "Collections" section', () => {
    const items = parseHomepageSection(homepageHtml, 'Collections');
    expect(items).toHaveLength(2);
  });

  it('extracts items from the "Network Originals" section', () => {
    const items = parseHomepageSection(homepageHtml, 'Network Originals', 'series');
    expect(items).toHaveLength(2);
  });

  it('returns an empty array for a non-existent section', () => {
    expect(parseHomepageSection(homepageHtml, 'Nonexistent Section')).toEqual([]);
  });

  it('returns an empty array for HTML without the expected structure', () => {
    expect(parseHomepageSection('<div></div>', 'Trending Now')).toEqual([]);
  });
});
