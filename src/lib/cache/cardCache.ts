/**
 * In-memory cache para cards do Scryfall
 * Evita requisições duplicadas durante o mesmo fluxo de importação
 * Cache é limpo após cada sessão para economizar memória
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class CardCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.DEFAULT_TTL,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
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
