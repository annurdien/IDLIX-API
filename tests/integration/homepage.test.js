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

const MOCK_HOMEPAGE = {
  above: [
    {
      title: 'Featured',
      data: [{ title: 'Featured Movie 1', slug: 'feat-1', contentType: 'movie' }]
    },
    {
      title: 'Recently Added Movies',
      data: [{ title: 'Recent Movie 1', slug: 'rec-1', contentType: 'movie' }]
    }
  ],
  below: [
    {
      title: 'Collections',
      data: [{ title: 'Collection 1', slug: 'col-1', contentType: 'movie' }]
    }
  ]
};

describe('Homepage Routes', () => {
  let app;

  beforeAll(() => { app = createApp(); });

  beforeEach(() => {
    jest.clearAllMocks();
    cache.isHit.mockReturnValue(false);
    cache.get.mockReturnValue(null);
  });

  describe('GET /api/', () => {
    it('returns API status', async () => {
      const res = await request(app).get('/api/');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/API/);
    });
  });

  describe('GET /api/featured', () => {
    it('returns featured items', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_HOMEPAGE);

      const res = await request(app).get('/api/featured');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].title).toBe('Featured Movie 1');
    });

    it('returns 500 on network error', async () => {
      httpClient.getJson.mockRejectedValue(new Error('Network error'));

      const res = await request(app).get('/api/featured');
      expect(res.status).toBe(500);
    });

    it('returns empty array when API returns null', async () => {
      httpClient.getJson.mockResolvedValue(null);

      const res = await request(app).get('/api/featured');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/cinemaxxi', () => {
    it('returns recently added movies', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_HOMEPAGE);

      const res = await request(app).get('/api/cinemaxxi');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].title).toBe('Recent Movie 1');
    });

    it('returns empty array when API returns null', async () => {
      httpClient.getJson.mockResolvedValue(null);

      const res = await request(app).get('/api/cinemaxxi');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/home/sections', () => {
    it('returns sections keyed by title', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_HOMEPAGE);

      const res = await request(app).get('/api/home/sections');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data['Featured']).toBeDefined();
      expect(res.body.data['Featured'][0].title).toBe('Featured Movie 1');
      expect(res.body.data['Recently Added Movies']).toBeDefined();
      expect(res.body.data['Collections']).toBeDefined();
    });

    it('returns empty object when API returns null', async () => {
      httpClient.getJson.mockResolvedValue(null);

      const res = await request(app).get('/api/home/sections');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({});
    });
  });

  describe('GET /api/home', () => {
    it('returns empty array when API returns null', async () => {
      httpClient.getJson.mockResolvedValue(null);

      const res = await request(app).get('/api/home');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('returns all items flat', async () => {
      httpClient.getJson.mockResolvedValue(MOCK_HOMEPAGE);

      const res = await request(app).get('/api/home');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3); // Featured, Recent, Collection
    });
  });
});
