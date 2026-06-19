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

const FIXTURES     = path.join(__dirname, '../fixtures');
const NETWORK_HTML = fs.readFileSync(path.join(FIXTURES, 'network.html'), 'utf-8');
const CARDS_HTML   = fs.readFileSync(path.join(FIXTURES, 'cards.html'),   'utf-8');

describe('Series Routes', () => {
  let app;

  beforeAll(() => { app = createApp(); });

  beforeEach(() => {
    jest.clearAllMocks();
    cache.isHit.mockReturnValue(false);
    cache.get.mockReturnValue(null);
  });

  // ── Network-based endpoints (Apple TV, Disney+, HBO, Netflix) ─────────────

  describe.each([
    ['/api/series/apple',  '/network/apple-tv',  'appletvseries'],
    ['/api/series/disney', '/network/disney',     'disneyplusseries'],
    ['/api/series/hbo',    '/network/HBO',        'hboseries'],
    ['/api/series/netflix','/network/netflix',    'netflixseries'],
  ])('GET %s', (endpoint, upstreamPath, cacheKey) => {
    it('returns 200 with an array of series', async () => {
      httpClient.get.mockResolvedValue({ data: NETWORK_HTML });

      const res = await request(app).get(endpoint);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(httpClient.get).toHaveBeenCalledWith(upstreamPath);
    });

    it('hits cache and skips HTTP when cache is fresh', async () => {
      const cached = [{ title: 'Cached Series', link: {} }];
      cache.isHit.mockReturnValue(true);
      cache.get.mockReturnValue(cached);

      const res = await request(app).get(endpoint);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(cached);
      expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('returns 500 on network error', async () => {
      httpClient.get.mockRejectedValue(new Error('timeout'));

      const res = await request(app).get(endpoint);

      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({ success: false });
    });
  });

  // ── GET /api/series/trending ──────────────────────────────────────────────

  describe('GET /api/series/trending', () => {
    const trendingSeriesHtml = `
      <div class="content right normal">
        <div class="items normal">
          <div class="item tvshows">
            <div class="poster">
              <a href="https://185.231.223.71/tvseries/trending-1/"></a>
              <img alt="Trending Series 1" data-src="https://img.example.com/ts1.jpg"/>
            </div>
          </div>
        </div>
      </div>`;

    it('returns 200 with trending TV series', async () => {
      httpClient.get.mockResolvedValue({ data: trendingSeriesHtml });

      const res = await request(app).get('/api/series/trending');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(httpClient.get).toHaveBeenCalledWith('/trending/?get=tv');
    });
  });

  // ── GET /api/series/marvel ────────────────────────────────────────────────

  describe('GET /api/series/marvel', () => {
    it('returns 200 with Marvel Studios series (card-style)', async () => {
      httpClient.get.mockResolvedValue({ data: CARDS_HTML });

      const res = await request(app).get('/api/series/marvel');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(httpClient.get).toHaveBeenCalledWith('/marvel-studios-series');
    });
  });

  // ── GET /api/series/netflix/:page ─────────────────────────────────────────

  describe('GET /api/series/netflix/:page', () => {
    it('returns 200 with series for a valid page', async () => {
      httpClient.get.mockResolvedValue({ data: NETWORK_HTML });

      const res = await request(app).get('/api/series/netflix/2');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(httpClient.get).toHaveBeenCalledWith('/network/netflix/page/2/');
    });

    it('returns 400 for a non-numeric page', async () => {
      const res = await request(app).get('/api/series/netflix/abc');
      expect(res.status).toBe(400);
      expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('returns 400 for page "0"', async () => {
      const res = await request(app).get('/api/series/netflix/0');
      expect(res.status).toBe(400);
    });

    it('returns 500 on network error', async () => {
      httpClient.get.mockRejectedValue(new Error('timeout'));

      const res = await request(app).get('/api/series/netflix/1');

      expect(res.status).toBe(500);
    });
  });
});
