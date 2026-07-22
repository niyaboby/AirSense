// In-memory cache for the demo session — no database needed per the brief.
// Each entry stores { value, expiresAt }. Nothing persists across server restarts.

const store = new Map();

/**
 * Get a cached value if it hasn't expired yet.
 * @param {string} key
 * @returns {any|undefined}
 */
export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

/**
 * Store a value with a time-to-live in milliseconds.
 * @param {string} key
 * @param {any} value
 * @param {number} ttlMs
 */
export function cacheSet(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheClear() {
  store.clear();
}
