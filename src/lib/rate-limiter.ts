/**
 * In-memory rate limiter using a sliding window algorithm.
 * Works per-IP across requests on the same Node.js instance.
 *
 * NOTE: In serverless (multi-instance) environments, each instance has its
 * own store. For distributed rate limiting, plug in Redis/Upstash here later.
 */

interface RateLimitWindow {
  count: number;
  resetAt: number;
}

const globalStore = globalThis as unknown as { rateLimitStore: Map<string, RateLimitWindow> };

if (!globalStore.rateLimitStore) {
  globalStore.rateLimitStore = new Map();
}

const store = globalStore.rateLimitStore;

export interface RateLimitConfig {
  /** Max number of requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and increment rate limit for a given key (e.g. IP address).
 */
export function checkRateLimit(key: string, opts: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const resetAt = now + opts.windowSeconds * 1000;

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: opts.limit - 1, resetAt };
  }

  if (entry.count >= opts.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: opts.limit - entry.count, resetAt: entry.resetAt };
}

// Periodic cleanup to avoid unbounded memory growth (runs at module load)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 60_000);
}
