import { container } from "./infrastructure/container";
import { TOKENS } from "./infrastructure/tokens";
import { ICacheService } from "./infrastructure/cache/cache-service";

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
export async function checkRateLimit(
  key: string,
  opts: RateLimitConfig,
): Promise<RateLimitResult> {
  const cache = container.resolve<ICacheService>(TOKENS.CacheService);
  const cacheKey = `ratelimit:${key}`;

  const currentCount = await cache.increment(cacheKey, opts.windowSeconds);
  const now = Date.now();
  const resetAt = now + opts.windowSeconds * 1000;

  if (currentCount > opts.limit) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return {
    allowed: true,
    remaining: opts.limit - currentCount,
    resetAt,
  };
}
