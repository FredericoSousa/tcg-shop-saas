import { container } from "../infrastructure/container";
import { TOKENS } from "../infrastructure/tokens";
import { ICacheService } from "../infrastructure/cache/cache-service";

/**
 * Cache para cards do Scryfall usando o ICacheService centralizado
 */
class CardCache {
  private readonly DEFAULT_TTL = 5 * 60; // 5 minutos em segundos

  private get service(): ICacheService {
    return container.resolve<ICacheService>(TOKENS.CacheService);
  }

  async set(key: string, data: unknown, ttlSeconds?: number): Promise<void> {
    await this.service.set(key, data, ttlSeconds ?? this.DEFAULT_TTL);
  }

  async get<T>(key: string): Promise<T | null> {
    return await this.service.get<T>(key);
  }

  async has(key: string): Promise<boolean> {
    return await this.service.has(key);
  }

  async clear(): Promise<void> {
    await this.service.clear();
  }
}

// Singleton instance
export const cardCache = new CardCache();

/**
 * Generates cache key for Scryfall card lookup
 */
export function generateCardCacheKey(
  identifier:
    | { name?: string; set?: string; collector_number?: string }
    | string,
): string {
  if (typeof identifier === "string") {
    return `card:${identifier}`;
  }

  const parts = [
    identifier.name,
    identifier.set,
    identifier.collector_number,
  ].filter(Boolean);
  return `card:${parts.join("|")}`;
}
