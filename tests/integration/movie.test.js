'use strict';

// Must be hoisted before any require of the real modules
jest.mock('../../src/lib/httpClient', () => ({
  getJson:       jest.fn(),
  getStreamData: jest.fn(),
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

const MOCK_API_LIST = {
  data: [
    { title: 'Movie 1', slug: 'movie-1', contentType: 'movie' },
    { title: 'Movie 2', slug: 'movie-2', contentType: 'movie' }
  ]
};

const MOCK_API_TRENDING = {
  above: [
    {
      title: 'Trending Now',
      data: [
        { title: 'Trending Movie 1', slug: 'trending-1', contentType: 'movie' }
      ]
    }
  ]
};

const MOCK_API_DETAIL = {
  title: 'Per Aspera Ad Astra',
  slug: 'per-aspera-ad-astra-2026',
  contentType: 'movie',
  releaseDate: '2026-05-10',
  overview: 'Test movie overview'
};

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
      httpClient.getJson.mockResolvedValue(MOCK_API_LIST);

      const res = await request(app).get('/api/movie');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(httpClient.getJson).toHaveBeenCalledWith('/api/movies?page=1&limit=36&sort=createdAt');
    });
  });

  // ── GET /api/movie/trending ───────────────────────────────────────────────

  describe('GET /api/movie/trending', () => {
    it('returns 200 with an array of movies on success', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_API_TRENDING);

      const res = await request(app).get('/api/movie/trending');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1); // only 1 movie in "Trending Now"
      expect(res.body.data[0]).toMatchObject({
        title: expect.any(String),
        link:  expect.objectContaining({ url: expect.any(String) }),
      });
      expect(httpClient.getJson).toHaveBeenCalledWith('/api/homepage');
    });

    it('returns cached data and skips HTTP when cache is fresh', async () => {
      const cached = [{ title: 'Cached', link: { endpoint: 'x', url: 'http://x', thumbnail: null } }];
      cache.isHit.mockReturnValue(true);
      cache.get.mockReturnValue(cached);

      const res = await request(app).get('/api/movie/trending');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(cached);
      expect(httpClient.getJson).not.toHaveBeenCalled();
    });

    it('returns 500 on network error', async () => {
      httpClient.getJson.mockRejectedValue(new Error('Network Error'));

      const res = await request(app).get('/api/movie/trending');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({ success: false, message: expect.any(String) });
    });
  });

  // ── GET /api/movie/trending/:page ─────────────────────────────────────────

  describe('GET /api/movie/trending/:page', () => {
    it('returns 200 with movies for page 1', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_API_LIST);

      const res = await request(app).get('/api/movie/trending/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(httpClient.getJson).toHaveBeenCalledWith('/api/movies?page=1&limit=36&sort=popularityScore');
    });

    it('returns 400 for a non-numeric page "abc"', async () => {
      const res = await request(app).get('/api/movie/trending/abc');
      expect(res.status).toBe(400);
      expect(httpClient.getJson).not.toHaveBeenCalled();
    });

    it('returns 400 for page "0"', async () => {
      const res = await request(app).get('/api/movie/trending/0');
      expect(res.status).toBe(400);
    });

    it('returns 500 on network error', async () => {
      httpClient.getJson.mockRejectedValue(new Error('Timeout'));

      const res = await request(app).get('/api/movie/trending/1');

      expect(res.status).toBe(500);
    });
  });

  // ── GET /api/movie/:slug ──────────────────────────────────────────────────

  describe('GET /api/movie/:slug', () => {
    it('returns 200 with rich detail metadata', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_API_DETAIL);

      const res = await request(app).get('/api/movie/per-aspera-ad-astra-2026');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        title: 'Per Aspera Ad Astra',
        year: 2026,
        type: 'movie',
      });
    });

    it('returns 404 for invalid slug characters (path traversal)', async () => {
      const res = await request(app).get('/api/movie/../../etc/passwd');
      expect(res.status).toBe(404);
    });

    it('returns 500 on network error', async () => {
      httpClient.getJson.mockRejectedValue(new Error('Timeout'));
      const res = await request(app).get('/api/movie/some-movie-2024');
      expect(res.status).toBe(500);
    });
  });

  // ── GET /api/movie/:slug/stream ───────────────────────────────────────────

  describe('GET /api/movie/:slug/stream', () => {
    it('returns stream URL when extraction succeeds', async () => {
      httpClient.getStreamData.mockResolvedValue({
        streamUrl:   'https://cdn.example.com/stream.m3u8',
        subtitles:   [{ lang: 'en', label: 'English', url: 'https://cdn.example.com/en.vtt' }],
        videoId:     'abc123',
        title:       'Test Movie',
        durationSec: 3600,
        maxHeight:   720,
        expiresAt:   9999999999,
      });

      const res = await request(app).get('/api/movie/some-movie-2024/stream');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.streamUrl).toBe('https://cdn.example.com/stream.m3u8');
      expect(Array.isArray(res.body.data.subtitles)).toBe(true);
      expect(res.body.data.subtitles[0].lang).toBe('en');
    });

    it('returns 404 when stream URL cannot be extracted', async () => {
      httpClient.getStreamData.mockResolvedValue({
        streamUrl: null, subtitles: [], videoId: null,
        title: null, durationSec: null, maxHeight: null, expiresAt: null,
      });

      const res = await request(app).get('/api/movie/some-movie-2024/stream');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
