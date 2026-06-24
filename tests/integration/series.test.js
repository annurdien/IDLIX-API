'use strict';

jest.mock('../../src/lib/httpClient', () => ({
  getJson:               jest.fn(),
  getStreamData:         jest.fn(),
  getEpisodeStreamData:  jest.fn(),
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
    { title: 'Series 1', slug: 'series-1', contentType: 'series' },
    { title: 'Series 2', slug: 'series-2', contentType: 'series' }
  ]
};

const MOCK_API_TRENDING = {
  above: [
    {
      title: 'Trending Now',
      data: [
        { title: 'Trending Series 1', slug: 'trending-1', contentType: 'series' },
        { title: 'Trending Series 2', slug: 'trending-2', contentType: 'series' }
      ]
    }
  ]
};

const MOCK_API_DETAIL = {
  title: 'Test Series Detail',
  slug: 'test-series-detail',
  contentType: 'series',
  numberOfSeasons: 2,
  firstAirDate: '2024-01-01',
  overview: 'This is a test series detail overview'
};

describe('Series Routes', () => {
  let app;

  beforeAll(() => { app = createApp(); });

  beforeEach(() => {
    jest.clearAllMocks();
    cache.isHit.mockReturnValue(false);
    cache.get.mockReturnValue(null);
  });

  // ── GET /api/series ────────────────────────────────────────────────────────

  describe('GET /api/series', () => {
    it('returns 200 with series browse items', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_API_LIST);

      const res = await request(app).get('/api/series');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(httpClient.getJson).toHaveBeenCalledWith('/api/series?page=1&limit=36&sort=createdAt');
    });

    it('returns cached data and skips HTTP when cache is fresh', async () => {
      const cached = [{ title: 'Cached Series', slug: 'cached-series' }];
      cache.isHit.mockReturnValue(true);
      cache.get.mockReturnValue(cached);

      const res = await request(app).get('/api/series');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(cached);
      expect(httpClient.getJson).not.toHaveBeenCalled();
    });
  });

  // ── GET /api/series/trending ──────────────────────────────────────────────

  describe('GET /api/series/trending', () => {
    it('returns 200 with trending TV series from homepage', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_API_TRENDING);

      const res = await request(app).get('/api/series/trending');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2); // 2 series in "Trending Now"
      expect(httpClient.getJson).toHaveBeenCalledWith('/api/homepage');
    });

    it('returns 500 on network error', async () => {
      httpClient.getJson.mockRejectedValue(new Error('timeout'));

      const res = await request(app).get('/api/series/trending');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({ success: false });
    });
  });

  // ── GET /api/series/:slug ─────────────────────────────────────────────────

  describe('GET /api/series/:slug', () => {
    it('returns 200 with rich series detail', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_API_DETAIL);

      const res = await request(app).get('/api/series/test-series-2024');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Series Detail');
      expect(res.body.data.year).toBe(2024);
      expect(httpClient.getJson).toHaveBeenCalledWith('/api/series/test-series-2024');
    });

    it('returns 404 when series detail has no title (not found)', async () => {
      httpClient.getJson.mockResolvedValue({});

      const res = await request(app).get('/api/series/missing-series');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 for invalid slug (path traversal)', async () => {
      const res = await request(app).get('/api/series/../../bad');
      expect(res.status).toBe(404);
    });
  });

  // ── GET /api/series/:slug/stream ──────────────────────────────────────────

  describe('GET /api/series/:slug/stream', () => {
    it('returns stream URL when extraction succeeds', async () => {
      httpClient.getStreamData.mockResolvedValue({
        streamUrl:   'https://cdn.example.com/ep.m3u8',
        subtitles:   [{ lang: 'id', label: 'Indonesian', url: 'https://cdn.example.com/id.vtt' }],
        videoId:     'xyz789',
        title:       'Test Series S01E01',
        durationSec: 2700,
        maxHeight:   1080,
        expiresAt:   9999999999,
      });

      const res = await request(app).get('/api/series/some-series-2024/stream');

      expect(res.status).toBe(200);
      expect(res.body.data.streamUrl).toBe('https://cdn.example.com/ep.m3u8');
      expect(Array.isArray(res.body.data.subtitles)).toBe(true);
    });

    it('returns 404 when stream URL cannot be extracted', async () => {
      httpClient.getStreamData.mockResolvedValue({
        streamUrl: null, subtitles: [], videoId: null,
        title: null, durationSec: null, maxHeight: null, expiresAt: null,
      });

      const res = await request(app).get('/api/series/some-series-2024/stream');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
  
  // ── GET /api/series/:slug/season/:season/episode/:episode/stream ──────────
  
  describe('GET /api/series/:slug/season/:season/episode/:episode/stream', () => {
    it('returns episode stream URL when extraction succeeds', async () => {
      httpClient.getEpisodeStreamData.mockResolvedValue({
        streamUrl:   'https://cdn.example.com/ep2.m3u8',
        subtitles:   [],
        videoId:     'abc1234',
        title:       'Test Series S01E02',
        durationSec: 2500,
        maxHeight:   1080,
        expiresAt:   9999999999,
      });

      const res = await request(app).get('/api/series/some-series-2024/season/1/episode/2/stream');

      expect(res.status).toBe(200);
      expect(res.body.data.streamUrl).toBe('https://cdn.example.com/ep2.m3u8');
      expect(res.body.data.season).toBe(1);
      expect(res.body.data.episode).toBe(2);
      expect(httpClient.getEpisodeStreamData).toHaveBeenCalledWith('some-series-2024', 1, 2);
    });

    it('returns 404 when episode stream URL cannot be extracted', async () => {
      httpClient.getEpisodeStreamData.mockResolvedValue({
        streamUrl: null, subtitles: [], videoId: null,
        title: null, durationSec: null, maxHeight: null, expiresAt: null,
      });

      const res = await request(app).get('/api/series/some-series-2024/season/1/episode/2/stream');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
    
    it('returns 400 for invalid season or episode', async () => {
      const res = await request(app).get('/api/series/some-series-2024/season/a/episode/b/stream');
      expect(res.status).toBe(400);
    });
  });
});
