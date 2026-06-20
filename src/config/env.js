'use strict';

/**
 * Centralised runtime configuration.
 * All environment-specific values must be read here — never hardcode elsewhere.
 */
module.exports = {
  /** Base URL of the upstream IDLIX site (no trailing slash). */
  BASE_URL: process.env.IDLIX_BASE_URL || 'https://z2.idlixku.com',

  /** HTTP port the server listens on. */
  PORT: process.env.PORT || 3000,

  /** Whether Puppeteer runs in headless mode (set to 'false' to debug). */
  PUPPETEER_HEADLESS: process.env.PUPPETEER_HEADLESS !== 'false',

  /**
   * How long (in ms) to cache the harvested CF cookies before re-harvesting.
   * Cloudflare clearance cookies typically last 30 minutes; default 25 min.
   * Set to 0 to always re-harvest (not recommended).
   */
  CF_COOKIE_REFRESH_MS: Number(process.env.CF_COOKIE_REFRESH_MS) || 25 * 60 * 1000,

  /**
   * Per-category cache TTLs in hours.
   * Each can be overridden via a corresponding CACHE_TTL_* env var.
   */
  CACHE_TTL: {
    page:        Number(process.env.CACHE_TTL_PAGE)        || 1,
    featured:    Number(process.env.CACHE_TTL_FEATURED)    || 1,
    cinemaxxi:   Number(process.env.CACHE_TTL_CINEMAXXI)   || 1,
    trending:    Number(process.env.CACHE_TTL_TRENDING)     || 1,
    series:      Number(process.env.CACHE_TTL_SERIES)       || 1,
    mcu:         Number(process.env.CACHE_TTL_MCU)          || 1,
    detail:      Number(process.env.CACHE_TTL_DETAIL)       || 2,
    search:      Number(process.env.CACHE_TTL_SEARCH)       || 0.5,
    leaderboard: Number(process.env.CACHE_TTL_LEADERBOARD)  || 1,
    home:        Number(process.env.CACHE_TTL_HOME)         || 1,
    // Stream URLs expire — keep TTL short (15 minutes = 0.25h)
    stream:      Number(process.env.CACHE_TTL_STREAM)       || 0.25,
  },
};
