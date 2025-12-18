/**
 * Cache Service - In-memory cache with TTL
 * Uses node-cache for simple, efficient caching
 */
const NodeCache = require('node-cache');

// Default TTL: 1 hour (3600 seconds)
const cache = new NodeCache({
    stdTTL: 3600,
    checkperiod: 600,  // Check for expired keys every 10 minutes
    useClones: false   // Better performance for simple values
});

/**
 * Get cached value or fetch and cache it
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch value if not cached
 * @param {number} ttl - Optional TTL in seconds (overrides default)
 */
const getOrFetch = async (key, fetchFn, ttl = null) => {
    const cached = cache.get(key);
    if (cached !== undefined) {
        console.log(`[Cache] HIT: ${key}`);
        return cached;
    }

    console.log(`[Cache] MISS: ${key} - fetching...`);
    const value = await fetchFn();

    if (value !== null && value !== undefined) {
        if (ttl) {
            cache.set(key, value, ttl);
        } else {
            cache.set(key, value);
        }
    }

    return value;
};

/**
 * Invalidate a cache key
 */
const invalidate = (key) => {
    cache.del(key);
    console.log(`[Cache] Invalidated: ${key}`);
};

/**
 * Clear all cache
 */
const clearAll = () => {
    cache.flushAll();
    console.log('[Cache] Cleared all');
};

module.exports = {
    cache,
    getOrFetch,
    invalidate,
    clearAll
};
