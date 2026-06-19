'use strict';

jest.mock('../../src/lib/httpClient', () => ({ get: jest.fn(), getStreamUrl: jest.fn() }));
jest.mock('../../src/lib/cacheService', () => ({
  isHit: jest.fn(),
  get:   jest.fn(),
  set:   jest.fn(),
}));

const request    = require('supertest');
const createApp  = require('../../src/app');
const httpClient = require('../../src/lib/httpClient');
const cache      = require('../../src/lib/cacheService');

const CATEGORY_HTML = `
  <section class="sr-only">
    <ul>
      <li><a href="/genre/drama">Drama</a></li>
      <li><a href="/country/CN">China</a></li>
      <li><a href="/country/US">United States</a></li>
      <li><a href="/year/2026">2026</a></li>
      <li><a href="/network/hbo">HBO</a></li>
    </ul>
  </section>`;

const MIXED_HTML = `
  <section class="sr-only">
    <ul>
      <li><a href="/movie/country-movie-1">Country Movie 1</a></li>
      <li><a href="/series/country-series-1">Country Series 1</a></li>
    </ul>
  </section>`;

describe('Catalog Routes', () => {
  let app;

  beforeAll(() => { app = createApp(); });

  beforeEach(() => {
    jest.clearAllMocks();
    cache.isHit.mockReturnValue(false);
    cache.get.mockReturnValue(null);
  });

  describe('GET /api/genre', () => {
    it('returns the genre index list with envelope', async () => {
      httpClient.get.mockResolvedValue({ data: CATEGORY_HTML });

      const res = await request(app).get('/api/genre');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(httpClient.get).toHaveBeenCalledWith('/genre');
    });
  });

  describe('GET /api/country', () => {
    it('returns the country index list with envelope', async () => {
      httpClient.get.mockResolvedValue({ data: CATEGORY_HTML });

      const res = await request(app).get('/api/country');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(httpClient.get).toHaveBeenCalledWith('/country');
    });
  });

  describe('GET /api/country/:country', () => {
    it('returns filtered media for a country page', async () => {
      httpClient.get.mockResolvedValue({ data: MIXED_HTML });

      const res = await request(app).get('/api/country/CN?type=series');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe('series');
      expect(httpClient.get).toHaveBeenCalledWith('/country/CN');
    });

    it('returns 404 for a paged request beyond page 1', async () => {
      httpClient.get.mockResolvedValue({ data: MIXED_HTML });

      const res = await request(app).get('/api/country/CN/2');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/year', () => {
    it('returns the year index list with envelope', async () => {
      httpClient.get.mockResolvedValue({ data: CATEGORY_HTML });

      const res = await request(app).get('/api/year');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(httpClient.get).toHaveBeenCalledWith('/year');
    });
  });

  describe('GET /api/year/:year', () => {
    it('returns media for a year page', async () => {
      httpClient.get.mockResolvedValue({ data: MIXED_HTML });

      const res = await request(app).get('/api/year/2026?type=movie');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe('movie');
      expect(httpClient.get).toHaveBeenCalledWith('/year/2026');
    });
  });

  describe('GET /api/network', () => {
    it('returns the network index list with envelope', async () => {
      httpClient.get.mockResolvedValue({ data: CATEGORY_HTML });

      const res = await request(app).get('/api/network');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(httpClient.get).toHaveBeenCalledWith('/network');
    });
  });

  describe('GET /api/network/:network', () => {
    it('returns media for a network page', async () => {
      httpClient.get.mockResolvedValue({ data: MIXED_HTML });

      const res = await request(app).get('/api/network/hbo');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(httpClient.get).toHaveBeenCalledWith('/network/hbo');
    });
  });

  describe('GET /api/search', () => {
    it('returns search results with query metadata', async () => {
      httpClient.get.mockResolvedValue({ data: MIXED_HTML });

      const res = await request(app).get('/api/search?q=batman');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.query).toBe('batman');
    });

    it('returns 400 when query is too short', async () => {
      const res = await request(app).get('/api/search?q=a');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when query is missing', async () => {
      const res = await request(app).get('/api/search');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/leaderboard', () => {
    it('returns leaderboard with count metadata', async () => {
      httpClient.get.mockResolvedValue({ data: MIXED_HTML });

      const res = await request(app).get('/api/leaderboard');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/home', () => {
    it('returns homepage items', async () => {
      httpClient.get.mockResolvedValue({ data: MIXED_HTML });

      const res = await request(app).get('/api/home');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
