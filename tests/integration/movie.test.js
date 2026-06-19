'use strict';

// Must be hoisted before any require of the real modules
jest.mock('../../src/lib/httpClient', () => ({
  get: jest.fn(),
  getStreamUrl: jest.fn(),
}));
jest.mock('../../src/lib/cacheService', () => ({
  isHit: jest.fn(),
  get:   jest.fn(),
  set:   jest.fn(),
}));

const request    = require('supertest');
const createApp  = require('../../src/app');
const httpClient = require('../../src/lib/httpClient');
const cache      = require('../../src/lib/cacheService');
const fs         = require('fs');
const path       = require('path');

const FIXTURES      = path.join(__dirname, '../fixtures');
const TRENDING_HTML  = fs.readFileSync(path.join(FIXTURES, 'trending.html'), 'utf-8');
const CARDS_HTML     = fs.readFileSync(path.join(FIXTURES, 'cards.html'),    'utf-8');
const HOMEPAGE_HTML  = fs.readFileSync(path.join(FIXTURES, 'homepage.html'), 'utf-8');
const DETAIL_HTML    = fs.readFileSync(path.join(__dirname, '../../site/movie_detail.html'), 'utf-8');
const EMPTY_HTML     = '<section class="sr-only"><ul></ul></section>';

describe('Movie Routes', () => {
  let app;

  beforeAll(() => { app = createApp(); });

  beforeEach(() => {
    jest.clearAllMocks();
    cache.isHit.mockReturnValue(false);
    cache.get.mockReturnValue(null);
  });

  // ── GET /api/movie ─────────────────────────────────────────────────────────

  describe('GET /api/movie', () => {
    it('returns 200 with envelope and movie browse items', async () => {
      httpClient.get.mockResolvedValue({ data: TRENDING_HTML });

      const res = await request(app).get('/api/movie');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(httpClient.get).toHaveBeenCalledWith('/movie');
    });
  });

  // ── GET /api/movie/trending ───────────────────────────────────────────────

  describe('GET /api/movie/trending', () => {
    it('returns 200 with an array of movies on success', async () => {
      httpClient.get.mockResolvedValue({ data: HOMEPAGE_HTML });

      const res = await request(app).get('/api/movie/trending');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1); // only 1 movie in "Trending Now"
      expect(res.body.data[0]).toMatchObject({
        title: expect.any(String),
        link:  expect.objectContaining({ url: expect.any(String) }),
      });
      expect(httpClient.get).toHaveBeenCalledWith('/');
    });

    it('returns cached data and skips HTTP when cache is fresh', async () => {
      const cached = [{ title: 'Cached', link: { endpoint: 'x', url: 'http://x', thumbnail: null } }];
      cache.isHit.mockReturnValue(true);
      cache.get.mockReturnValue(cached);

      const res = await request(app).get('/api/movie/trending');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(cached);
      expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('stores scraped results in cache', async () => {
      httpClient.get.mockResolvedValue({ data: HOMEPAGE_HTML });

      await request(app).get('/api/movie/trending');

      expect(cache.set).toHaveBeenCalledWith('trending', expect.any(Array));
    });

    it('returns 500 on network error', async () => {
      httpClient.get.mockRejectedValue(new Error('Network Error'));

      const res = await request(app).get('/api/movie/trending');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({ success: false, message: expect.any(String) });
    });
  });

  // ── GET /api/movie/trending/:page ─────────────────────────────────────────

  describe('GET /api/movie/trending/:page', () => {
    it('returns 200 with movies for page 1', async () => {
      httpClient.get.mockResolvedValue({ data: TRENDING_HTML });

      const res = await request(app).get('/api/movie/trending/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(httpClient.get).toHaveBeenCalledWith('/movie');
    });

    it('returns 404 when the requested page has no results', async () => {
      httpClient.get.mockResolvedValue({ data: EMPTY_HTML });

      const res = await request(app).get('/api/movie/trending/999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 for page 2 (new site has no pagination)', async () => {
      httpClient.get.mockResolvedValue({ data: TRENDING_HTML });

      const res = await request(app).get('/api/movie/trending/2');

      expect(res.status).toBe(404);
    });

    it('returns 400 for a non-numeric page "abc"', async () => {
      const res = await request(app).get('/api/movie/trending/abc');
      expect(res.status).toBe(400);
      expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('returns 400 for page "0"', async () => {
      const res = await request(app).get('/api/movie/trending/0');
      expect(res.status).toBe(400);
    });

    it('returns 500 on network error', async () => {
      httpClient.get.mockRejectedValue(new Error('Timeout'));

      const res = await request(app).get('/api/movie/trending/1');

      expect(res.status).toBe(500);
    });
  });

  // ── GET /api/movie/mcu ────────────────────────────────────────────────────

  describe('GET /api/movie/mcu', () => {
    it('returns 200 with collection items from homepage', async () => {
      httpClient.get.mockResolvedValue({ data: CARDS_HTML });

      const res = await request(app).get('/api/movie/mcu');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(httpClient.get).toHaveBeenCalledWith('/');
    });

    it('returns 500 on network error', async () => {
      httpClient.get.mockRejectedValue(new Error('Timeout'));

      const res = await request(app).get('/api/movie/mcu');

      expect(res.status).toBe(500);
    });
  });

  // ── GET /api/movie/:slug ──────────────────────────────────────────────────

  describe('GET /api/movie/:slug', () => {
    it('returns 200 with rich detail metadata', async () => {
      httpClient.get.mockResolvedValue({ data: DETAIL_HTML });

      const res = await request(app).get('/api/movie/per-aspera-ad-astra-2026');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        title: 'Per Aspera Ad Astra',
        year: 2026,
        type: 'movie',
      });
    });

    it('returns 400 for invalid slug characters', async () => {
      const res = await request(app).get('/api/movie/../../etc/passwd');
      expect(res.status).toBe(400);
    });

    it('returns 500 on network error', async () => {
      httpClient.get.mockRejectedValue(new Error('Timeout'));
      const res = await request(app).get('/api/movie/some-movie-2024');
      expect(res.status).toBe(500);
    });
  });

  // ── GET /api/movie/:slug/stream ───────────────────────────────────────────

  describe('GET /api/movie/:slug/stream', () => {
    it('returns stream URL when extraction succeeds', async () => {
      httpClient.getStreamUrl.mockResolvedValue('https://cdn.example.com/stream.m3u8');

      const res = await request(app).get('/api/movie/some-movie-2024/stream');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.streamUrl).toBe('https://cdn.example.com/stream.m3u8');
    });

    it('returns 404 when stream URL cannot be extracted', async () => {
      httpClient.getStreamUrl.mockResolvedValue(null);

      const res = await request(app).get('/api/movie/some-movie-2024/stream');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
