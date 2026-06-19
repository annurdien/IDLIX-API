# IDLIX API v3

[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/annurdien/IDLIX-API/blob/main/LICENSE)

A REST API that scrapes `https://z2.idlixku.com/` using **Puppeteer + stealth plugin** to bypass Cloudflare and extract all available content data.

## Features

- ✅ Cloudflare bypass via `puppeteer-extra` + `stealth-plugin`
- ✅ Full detail pages — rich metadata from JSON-LD structured data
- ✅ Stream URL extraction via Puppeteer network interception
- ✅ Search endpoint
- ✅ Leaderboard endpoint
- ✅ All category pages: Movies, TV Series, Genres, Countries, Years, Networks
- ✅ Consistent `{ success, data, pagination, filters }` response envelope
- ✅ In-memory TTL cache

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
| GET | `/series/:slug/stream` | Extract stream URL (Puppeteer) |

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

## Stream URL Extraction

The `/stream` endpoints use Puppeteer to navigate the player page and intercept the HLS/DASH manifest URL:

```bash
curl http://localhost:3000/api/movie/per-aspera-ad-astra-2026/stream
```

> **Note:** Stream URLs may expire. The cache TTL is set to 15 minutes by default. If extraction fails (Cloudflare blocks, JS challenge), the response returns `null` for `streamUrl`.

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
