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

  /**
   * Per-category cache TTLs in hours.
   * Each can be overridden via a corresponding CACHE_TTL_* env var.
   */
  CACHE_TTL: {
    page:      Number(process.env.CACHE_TTL_PAGE)      || 1,
    featured:  Number(process.env.CACHE_TTL_FEATURED)  || 1,
    cinemaxxi: Number(process.env.CACHE_TTL_CINEMAXXI) || 1,
    trending:  Number(process.env.CACHE_TTL_TRENDING)  || 1,
    series:    Number(process.env.CACHE_TTL_SERIES)    || 1,
    mcu:       Number(process.env.CACHE_TTL_MCU)       || 1,
  },
};
