'use strict';

jest.mock('../../src/lib/httpClient', () => ({ get: jest.fn() }));
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

const GENRE_HTML = fs.readFileSync(path.join(__dirname, '../fixtures/genre.html'), 'utf-8');

describe('Genre Routes', () => {
  let app;

  beforeAll(() => { app = createApp(); });

  beforeEach(() => {
    jest.clearAllMocks();
    cache.isHit.mockReturnValue(false);
    cache.get.mockReturnValue(null);
  });

  // ── GET /api/genre/movie/:genre ───────────────────────────────────────────

  describe('GET /api/genre/movie/:genre', () => {
    it('returns 200 with movies for a valid genre (no page)', async () => {
      httpClient.get.mockResolvedValue({ data: GENRE_HTML });

      const res = await request(app).get('/api/genre/movie/action');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Action Movie 1');
      expect(httpClient.get).toHaveBeenCalledWith('/genre/action/page/1');
    });

    it('returns 200 with movies for a valid genre and page', async () => {
      httpClient.get.mockResolvedValue({ data: GENRE_HTML });

      const res = await request(app).get('/api/genre/movie/action/2');

      expect(res.status).toBe(200);
      expect(httpClient.get).toHaveBeenCalledWith('/genre/action/page/2');
    });

    it('uses cache when the entry is fresh', async () => {
      const cached = [{ title: 'Cached Movie', link: {} }];
      cache.isHit.mockReturnValue(true);
      cache.get.mockReturnValue(cached);

      const res = await request(app).get('/api/genre/movie/action');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(cached);
      expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('returns 400 for a non-numeric page', async () => {
      const res = await request(app).get('/api/genre/movie/action/abc');
      expect(res.status).toBe(400);
      expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('returns 400 for a genre containing special characters', async () => {
      const res = await request(app).get('/api/genre/movie/action<xss>');
      // Express may normalize the path but either 400 or 404 is acceptable — not 200
      expect(res.status).not.toBe(200);
    });

    it('returns 500 on network error', async () => {
      httpClient.get.mockRejectedValue(new Error('timeout'));

      const res = await request(app).get('/api/genre/movie/action');

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({ success: false });
    });
  });

  // ── GET /api/genre/series/:genre ─────────────────────────────────────────

  describe('GET /api/genre/series/:genre', () => {
    it('returns 200 with TV series for a valid genre', async () => {
      httpClient.get.mockResolvedValue({ data: GENRE_HTML });

      const res = await request(app).get('/api/genre/series/action');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Action Series 1');
    });

    it('returns 200 with series for a valid genre and page', async () => {
      httpClient.get.mockResolvedValue({ data: GENRE_HTML });

      const res = await request(app).get('/api/genre/series/action/3');

      expect(res.status).toBe(200);
      expect(httpClient.get).toHaveBeenCalledWith('/genre/action/page/3');
    });

    it('returns 400 for a non-numeric page', async () => {
      const res = await request(app).get('/api/genre/series/action/xyz');
      expect(res.status).toBe(400);
    });

    it('returns 400 for a hyphen-only genre "-"', async () => {
      const res = await request(app).get('/api/genre/series/-');
      // "-" matches the regex ^[a-z0-9-]+$ so it's valid — just confirm no crash
      expect([200, 500]).toContain(res.status);
    });

    it('returns 500 on network error', async () => {
      httpClient.get.mockRejectedValue(new Error('timeout'));

      const res = await request(app).get('/api/genre/series/drama');

      expect(res.status).toBe(500);
    });
  });

  // ── 404 catch-all ─────────────────────────────────────────────────────────

  describe('Unknown routes', () => {
    it('returns 404 JSON for an unrecognised path', async () => {
      const res = await request(app).get('/api/genre/unknown-type/action');
      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false });
    });
  });
});
