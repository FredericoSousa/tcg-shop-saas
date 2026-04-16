import Redis from "ioredis";

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  increment(key: string, ttlSeconds?: number): Promise<number>;
}

export class MemoryCacheService implements ICacheService {
  private cache: Map<string, { value: any; expiresAt: number | null }> = new Map();

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
    const current = (await this.get<number>(key)) || 0;
    const newValue = current + 1;
    await this.set(key, newValue, ttlSeconds);
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

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const multi = this.redis.multi();
      multi.incr(key);
      if (ttlSeconds) {
        multi.expire(key, ttlSeconds);
      }
      const results = await multi.exec();
      if (!results || !results[0]) return 0;
      const [err, value] = results[0];
      if (err) throw err;
      return value as number;
    } catch (err) {
      console.error(`Error incrementing key ${key} in Redis:`, err);
      return 0;
    }
  }
}
