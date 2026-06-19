'use strict';

/**
 * Simple in-memory TTL cache backed by a Map.
 * Replaces the quick.db dependency — no SQLite file required.
 * The CacheService class is exported for unit testing; the singleton
 * instance is the default export consumed by services.
 */
class CacheService {
  constructor() {
    /** @type {Map<string, {data: *, timestamp: number}>} */
    this._store = new Map();
  }

  /**
   * Check whether a cached entry exists and is within its TTL.
   * @param {string} key
   * @param {number} ttlHours
   * @returns {boolean}
   */
  isHit(key, ttlHours) {
    const entry = this._store.get(key);
    if (!entry) return false;
    return (Date.now() - entry.timestamp) < ttlHours * 3_600_000;
  }

  /**
   * Retrieve cached data for a key.
   * @param {string} key
   * @returns {*} Stored data, or null if not present.
   */
  get(key) {
    const entry = this._store.get(key);
    return entry ? entry.data : null;
  }

  /**
   * Store data in the cache with the current timestamp.
   * @param {string} key
   * @param {*} data
   */
  set(key, data) {
    this._store.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Remove all entries. Primarily useful in tests.
   */
  clear() {
    this._store.clear();
  }
}

const instance = new CacheService();
module.exports = instance;
module.exports.CacheService = CacheService; // exposed for unit testing
