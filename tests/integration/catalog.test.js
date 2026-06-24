'use strict';

jest.mock('../../src/lib/httpClient', () => ({
  getJson: jest.fn(),
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

const MOCK_GENRES = { data: [{ name: 'Action', slug: 'action' }] };
const MOCK_COUNTRIES = { data: [{ name: 'China', code: 'CN' }] };
const MOCK_YEARS = { data: ['2026', '2025'] };
const MOCK_BROWSE = { data: [{ title: 'Movie 1', slug: 'm1', contentType: 'movie' }] };
const MOCK_SEARCH = { results: [{ title: 'Batman', slug: 'batman', contentType: 'movie' }] };
const MOCK_LEADERBOARD = { topMovies: [{ title: 'Top Movie', slug: 't1', contentType: 'movie' }] };
const MOCK_HOMEPAGE = { above: [{ title: 'Trending', data: [{ title: 'Trend', slug: 'tr', contentType: 'movie' }] }] };

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
      httpClient.getJson.mockResolvedValue(MOCK_GENRES);

      const res = await request(app).get('/api/genre');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].slug).toBe('action');
      expect(httpClient.getJson).toHaveBeenCalledWith('/api/genres');
    });
  });

  describe('GET /api/country', () => {
    it('returns the country index list with envelope', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_COUNTRIES);

      const res = await request(app).get('/api/country');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].slug).toBe('CN');
      expect(httpClient.getJson).toHaveBeenCalledWith('/api/browse/countries');
    });
  });

  describe('GET /api/country/:country', () => {
    it('returns filtered media for a country page', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_BROWSE);

      const res = await request(app).get('/api/country/CN?type=movie');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe('movie');
      expect(httpClient.getJson).toHaveBeenCalledWith('/api/movies?country=CN&page=1&limit=36&sort=createdAt');
    });

    it('returns 200 for a paged request on page 2', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_BROWSE);
      const res = await request(app).get('/api/country/CN/2');
      expect(res.status).toBe(200);
      expect(httpClient.getJson).toHaveBeenCalledWith('/api/movies?country=CN&page=2&limit=36&sort=createdAt');
    });
  });

  describe('GET /api/year', () => {
    it('returns the year index list with envelope', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_YEARS);

      const res = await request(app).get('/api/year');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].slug).toBe('2026');
      expect(httpClient.getJson).toHaveBeenCalledWith('/api/browse/years');
    });
  });

  describe('GET /api/year/:year', () => {
    it('returns media for a year page', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_BROWSE);

      const res = await request(app).get('/api/year/2026?type=movie');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe('movie');
      expect(httpClient.getJson).toHaveBeenCalledWith('/api/movies?year=2026&page=1&limit=36&sort=createdAt');
    });
  });

  describe('GET /api/network', () => {
    it('returns the network index list with envelope (hardcoded)', async () => {
      const res = await request(app).get('/api/network');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(httpClient.getJson).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/network/:network', () => {
    it('returns media for a network page', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_BROWSE);

      const res = await request(app).get('/api/network/hbo?type=movie');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(httpClient.getJson).toHaveBeenCalledWith('/api/movies?network=hbo&page=1&limit=36&sort=createdAt');
    });
  });

  describe('GET /api/search', () => {
    it('returns search results with query metadata', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_SEARCH);

      const res = await request(app).get('/api/search?q=batman');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.query).toBe('batman');
      expect(httpClient.getJson).toHaveBeenCalledWith('/api/search?q=batman');
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
    it('returns leaderboard with metadata', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_LEADERBOARD);

      const res = await request(app).get('/api/leaderboard');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.topMovies).toBeDefined();
      expect(httpClient.getJson).toHaveBeenCalledWith('/api/leaderboard');
    });
  });

  describe('GET /api/home', () => {
    it('returns homepage items', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_HOMEPAGE);

      const res = await request(app).get('/api/home');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(httpClient.getJson).toHaveBeenCalledWith('/api/homepage');
    });
  });
});
