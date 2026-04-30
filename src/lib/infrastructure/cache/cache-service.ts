import Redis from "ioredis";

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  /**
   * Atomically writes the value only if the key is absent. Returns true
   * if the value was written, false if the key already existed.
   */
  setIfAbsent<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  increment(key: string, ttlSeconds?: number): Promise<number>;
}

export class MemoryCacheService implements ICacheService {
  private cache: Map<string, { value: unknown; expiresAt: number | null }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiresAt });
  }

  async setIfAbsent<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    // Inline check + write so two concurrent callers can't both observe an
    // empty slot before either has set it. Awaiting `has()` then `set()`
    // separately would let microtask interleaving break the guarantee.
    const entry = this.cache.get(key);
    const live = entry && (!entry.expiresAt || entry.expiresAt > Date.now());
    if (live) return false;
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiresAt });
    return true;
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const entry = this.cache.get(key);
    const expired = entry?.expiresAt != null && entry.expiresAt < Date.now();
    const current = entry && !expired ? (entry.value as number) : 0;
    const newValue = current + 1;

    // Mirror RedisCacheService: only set the TTL on first creation so a
    // sustained burst doesn't refresh the window.
    const expiresAt =
      ttlSeconds && (current === 0 || expired)
        ? Date.now() + ttlSeconds * 1000
        : entry?.expiresAt ?? null;

    this.cache.set(key, { value: newValue, expiresAt });
    return newValue;
  }
}

export class RedisCacheService implements ICacheService {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on("error", (err) => {
      console.error("Redis Cache Error:", err);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      console.error(`Error getting key ${key} from Redis:`, err);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const data = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.set(key, data, "EX", ttlSeconds);
      } else {
        await this.redis.set(key, data);
      }
    } catch (err) {
      console.error(`Error setting key ${key} in Redis:`, err);
    }
  }

  async setIfAbsent<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const data = JSON.stringify(value);
      const result = ttlSeconds
        ? await this.redis.set(key, data, "EX", ttlSeconds, "NX")
        : await this.redis.set(key, data, "NX");
      return result === "OK";
    } catch (err) {
      console.error(`Error setIfAbsent key ${key} in Redis:`, err);
      return false;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (err) {
      console.error(`Error checking key ${key} in Redis:`, err);
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      console.error(`Error deleting key ${key} from Redis:`, err);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (err) {
      console.error("Error clearing Redis cache:", err);
    }
  }

  /**
   * Increments and applies the TTL only on first creation, so a sustained
   * burst at the limit does not refresh the window indefinitely.
   *
   * Implemented via a single EVAL so the INCR + conditional EXPIRE
   * happen atomically — no chance of a missed expiry between commands.
   */
  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      if (!ttlSeconds) {
        return await this.redis.incr(key);
      }
      const script =
        "local v = redis.call('INCR', KEYS[1]) " +
        "if v == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end " +
        "return v";
      const value = await this.redis.eval(script, 1, key, String(ttlSeconds));
      return Number(value);
    } catch (err) {
      console.error(`Error incrementing key ${key} in Redis:`, err);
      return 0;
    }
  }
}
