# IDLIX API v3

[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/annurdien/IDLIX-API/blob/main/LICENSE)

A REST API that scrapes `https://z2.idlixku.com/` using **Puppeteer + stealth plugin** to bypass Cloudflare and extract all available content data.

## Features

- **Cloudflare Bypass (TLS Fingerprinting):** Persistent headless Chromium singleton to seamlessly mirror BoringSSL signatures and bypass strict 403 Forbidden Cloudflare blocks.
- **Rich Stream Metadata:** Directly extracts the internal majorplay.net JSON configurations, including stream URLs, multi-language subtitle tracks, duration, and video IDs.
- **Resilient JSON Scraping:** The API now directly maps IDLIX's native JSON APIs (`/api/movies`, `/api/series`, etc.) to objects rather than using brittle Cheerio HTML parsing, resulting in **O(1) list mapping** and absolute layout resilience.
- **Interactive API Documentation:** Powered by Scalar (OpenAPI 3.0.0), available at `/docs`.
- **Complete Feature Set:** Full detail pages, search endpoints, leaderboard, and all category filters (Movies, TV Series, Genres, Countries, Years, Networks).
- **Consistent Response Envelope:** Standardized `{ success, data, pagination, filters }` output format.
- **In-memory TTL Cache:** Configurable caching for blisteringly fast responses.

## Installation

```bash
git clone https://github.com/annurdien/IDLIX-API.git
cd IDLIX-API
npm install
cp .env.example .env
npm start
```

> **Requirements:** Node.js 18+ (Puppeteer downloads Chromium automatically)

---

## API Reference

**Base URL:** `http://localhost:3000/api`

All responses follow the envelope:
```json
{
  "success": true,
  "data": [...],
  "pagination": { "currentPage": 1, "totalPages": 5, "hasNext": true },
  "filters": { "type": "movie", "genre": "action" }
}
```

---

### General

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API status |
| GET | `/home` | All homepage content (flat array) |
| GET | `/home/sections` | Homepage content grouped by section |
| GET | `/featured` | Trending Now content |
| GET | `/cinemaxxi` | Recently Added Movies |

---

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search?q=batman` | Search movies & series |

---

### Leaderboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/leaderboard` | Top ranked content |

---

### Movies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/movie` | Browse all movies |
| GET | `/movie/trending` | Trending movies |
| GET | `/movie/trending/:page` | Trending movies (page N) |
| GET | `/movie/mcu` | Collections / curated picks |
| GET | `/movie/:slug` | Movie detail — full metadata |
| GET | `/movie/:slug/stream` | Extract stream URL (Puppeteer) |

**Example detail response:**
```json
{
  "success": true,
  "data": {
    "title": "Per Aspera Ad Astra",
    "year": 2026,
    "type": "movie",
    "runtime": "PT111M",
    "runtimeMinutes": 111,
    "overview": "...",
    "poster": "https://image.tmdb.org/...",
    "backdrop": "https://image.tmdb.org/...",
    "genres": ["Drama", "Adventure", "Science Fiction"],
    "country": "China",
    "countryCode": "CN",
    "language": "Chinese",
    "director": { "name": "Han Yan", "url": "..." },
    "cast": [{ "name": "Dylan Wang", "character": "Xu Tianbiao", "image": "..." }],
    "trailer": "https://www.youtube.com/watch?v=...",
    "watchUrl": "https://z2.idlixku.com/movie/per-aspera-ad-astra-2026?play=1",
    "streamUrl": null,
    "keywords": ["virtual reality", "dream realm"],
    "recommendations": [...]
  }
}
```

---

### TV Series

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/series` | Browse all series |
| GET | `/series/trending` | Trending series |
| GET | `/series/marvel` | Network Originals section |
| GET | `/series/apple` | Apple TV+ series |
| GET | `/series/disney` | Disney+ series |
| GET | `/series/hbo` | HBO series |
| GET | `/series/netflix` | Netflix series |
| GET | `/series/netflix/:page` | Netflix series (page N) |
| GET | `/series/:slug` | Series detail — full metadata |
| GET | `/series/:slug/season/:season/episode/:episode/stream` | Extract episode stream URL & subtitles |

---

### Genres

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/genre` | List all genres |
| GET | `/genre/:genre` | Browse by genre (all types) |
| GET | `/genre/:genre?type=movie` | Browse genre — movies only |
| GET | `/genre/:genre?type=series` | Browse genre — series only |
| GET | `/genre/movie/:genre` | Movies in genre |
| GET | `/genre/series/:genre` | Series in genre |

**Available genres:** `action`, `adventure`, `animation`, `anime`, `comedy`, `crime`, `drama`, `drama-korea`, `family`, `fantasy`, `history`, `horror`, `kids`, `mystery`, `science-fiction`, `thriller`, `war`

---

### Countries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/country` | List all countries |
| GET | `/country/:country` | Browse by country |
| GET | `/country/:country?type=movie` | Filter movies only |
| GET | `/country/:country?type=series` | Filter series only |

---

### Years

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/year` | List all years |
| GET | `/year/:year` | Browse by year (e.g. `/year/2024`) |
| GET | `/year/:year?type=movie` | Filter movies only |

---

### Networks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/network` | List all networks |
| GET | `/network/netflix` | Netflix content |
| GET | `/network/hbo` | HBO content |
| GET | `/network/disney-plus` | Disney+ content |
| GET | `/network/apple-tv-plus` | Apple TV+ content |
| GET | `/network/amazon-prime-video` | Prime Video content |
| GET | `/network/:network?type=series` | Filter by type |

---

## Stream URL Extraction Architecture

Unlike previous versions that relied on brittle Puppeteer network interception, the `/stream` endpoints now flawlessly replicate the internal 6-step IDLIX proxy chain while completely bypassing Cloudflare Bot Management.

### How it Works

Because Cloudflare instantly blocks standard Node.js `fetch()` requests due to a **TLS Fingerprint mismatch** (OpenSSL vs. Chromium's BoringSSL), the API maintains a singleton, headless Chromium tab parked on the base URL. All protected API requests are executed *inside* this browser context using `page.evaluate(fetch())`, ensuring a perfect fingerprint.

The extraction follows this sequence:
1. **UUID Resolution:** Calls `/api/movies/{slug}` or `/api/series/{slug}/season/{season}` to retrieve internal Movie/Series/Episode UUIDs.
2. **Analytics Tracking:** Pings `/api/views/track`.
3. **Gate Token Generation:** Requests `/api/watch/play-info/` which returns a `gateToken` and an `unlockAt` timestamp.
4. **Mandatory Delay:** The API honors IDLIX's internal 15-second anti-scraping timer (`unlockAt - serverNow`). 
5. **Session Claim:** Exchanges the unlocked `gateToken` for a JSON Web Token and a redemption URL.
6. **Final Resolution:** Fires a blazing-fast, direct Node.js `fetch()` to `majorplay.net` (which lacks Cloudflare protection) to redeem the token and extract the final `.json` configuration containing `.m3u8` links and `.vtt` subtitles.

**Example movie stream request:**
```bash
curl http://localhost:3000/api/movie/per-aspera-ad-astra-2026/stream
```

**Example series stream request:**
```bash
curl http://localhost:3000/api/series/oasis-2026/season/1/episode/1/stream
```

> **Note:** The very first request after an API restart will take ~25 seconds (booting Puppeteer + solving Cloudflare JS challenge + the mandatory 15s API gate). Subsequent streams only suffer the mandatory 15-second API delay. Stream configurations are cached in-memory.

---

## Environment Variables

See [`.env.example`](.env.example) for all available configuration options.

| Variable | Default | Description |
|----------|---------|-------------|
| `IDLIX_BASE_URL` | `https://z2.idlixku.com` | Upstream site URL |
| `PORT` | `3000` | API server port |
| `PUPPETEER_HEADLESS` | `true` | Set `false` to show browser (debug) |
| `CACHE_TTL_DETAIL` | `2` | Detail page cache (hours) |
| `CACHE_TTL_STREAM` | `0.25` | Stream URL cache (hours = 15min) |
| `CACHE_TTL_SEARCH` | `0.5` | Search cache (hours = 30min) |

---

**Contribution are welcome**
