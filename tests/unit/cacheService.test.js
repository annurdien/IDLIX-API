'use strict';

const { CacheService } = require('../../src/lib/cacheService');

describe('CacheService', () => {
  /** @type {CacheService} */
  let cache;

  beforeEach(() => {
    cache = new CacheService();
  });

  // ── isHit ────────────────────────────────────────────────────────────────

  describe('isHit()', () => {
    it('returns false for an unknown key', () => {
      expect(cache.isHit('nonexistent', 1)).toBe(false);
    });

    it('returns true for a freshly stored entry within TTL', () => {
      cache.set('key', { value: 42 });
      expect(cache.isHit('key', 1)).toBe(true);
    });

    it('returns false for an entry older than the TTL', () => {
      cache.set('key', 'data');
      // Backdate timestamp by 2 hours
      cache._store.set('key', { data: 'data', timestamp: Date.now() - 2 * 3_600_000 });
      expect(cache.isHit('key', 1)).toBe(false);
    });

    it('returns true when entry timestamp is 1 ms inside the TTL boundary', () => {
      cache.set('key', 'data');
      // 1 ms before the TTL expires
      cache._store.set('key', { data: 'data', timestamp: Date.now() - 3_600_000 + 1 });
      expect(cache.isHit('key', 1)).toBe(true);
    });

    it('returns false when entry timestamp is exactly on the TTL boundary', () => {
      cache.set('key', 'data');
      cache._store.set('key', { data: 'data', timestamp: Date.now() - 3_600_000 });
      // Date.now() - timestamp === ttlHours * 3_600_000 → NOT less than → miss
      expect(cache.isHit('key', 1)).toBe(false);
    });
  });

  // ── get ──────────────────────────────────────────────────────────────────

  describe('get()', () => {
    it('returns null for an unknown key', () => {
      expect(cache.get('missing')).toBeNull();
    });

    it('returns the data for a known key', () => {
      const movies = [{ title: 'Test' }];
      cache.set('movies', movies);
      expect(cache.get('movies')).toEqual(movies);
    });

    it('returns the latest value after multiple sets on the same key', () => {
      cache.set('k', 'first');
      cache.set('k', 'second');
      expect(cache.get('k')).toBe('second');
    });

    it('returns null after clear()', () => {
      cache.set('x', 'val');
      cache.clear();
      expect(cache.get('x')).toBeNull();
    });
  });

  // ── set ──────────────────────────────────────────────────────────────────

  describe('set()', () => {
    it('stores data with a current timestamp', () => {
      const before = Date.now();
      cache.set('k', { foo: 'bar' });
      const entry = cache._store.get('k');
      expect(entry.data).toEqual({ foo: 'bar' });
      expect(entry.timestamp).toBeGreaterThanOrEqual(before);
      expect(entry.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('accepts any serialisable value (array, object, number, string)', () => {
      cache.set('arr', [1, 2, 3]);
      cache.set('num', 99);
      cache.set('str', 'hello');
      expect(cache.get('arr')).toEqual([1, 2, 3]);
      expect(cache.get('num')).toBe(99);
      expect(cache.get('str')).toBe('hello');
    });
  });

  // ── clear ────────────────────────────────────────────────────────────────

  describe('clear()', () => {
    it('removes all entries from the store', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.clear();
      expect(cache.get('a')).toBeNull();
      expect(cache.get('b')).toBeNull();
      expect(cache.get('c')).toBeNull();
    });

    it('leaves the cache in a usable state after clearing', () => {
      cache.set('x', 'before');
      cache.clear();
      cache.set('x', 'after');
      expect(cache.get('x')).toBe('after');
    });
  });
});
