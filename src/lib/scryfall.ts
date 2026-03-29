import { ScryfallCard } from '@scryfall/api-types'

type Card = ScryfallCard.Any

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const CACHE_TTL = 1000 * 60 * 60; // 1 hora de cache (em milissegundos)

// Retém a instância do cache em memória durante o dev fast-refresh (HMR)
const globalForCache = globalThis as unknown as { scryfallCache: Map<string, CacheEntry> };
const cache = globalForCache.scryfallCache || new Map<string, CacheEntry>();

if (process.env.NODE_ENV !== 'production') {
  globalForCache.scryfallCache = cache;
}

export const scryfall = {
  /**
   * Busca cards baseados na sintaxe do Scryfall
   */
  async searchCards(query: string): Promise<Card[]> {
    if (!query) return [];

    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as Card[];
    }

    try {
      // Usamos delay conforme docs da API Scryfall recomenda 100ms se fizéssemos muitas, mas para uma única fetch é ok.
      const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints`);

      if (!response.ok) {
        if (response.status === 404) {
          // 404 significa sem resultados na API do Scryfall para a query.
          return [];
        }
        throw new Error(`Scryfall API error: ${response.status}`);
      }

      const data = await response.json();
      const results = data.data || [];

      cache.set(cacheKey, {
        data: results,
        expiresAt: Date.now() + CACHE_TTL
      });

      return results;
    } catch (error) {
      console.error('Erro na busca do Scryfall:', error);
      return [];
    }
  },

  /**
   * Pega os detalhes exatos de um card pelo seu ID do Scryfall
   */
  async getCardById(id: string): Promise<Card | null> {
    const cacheKey = `card:${id}`;
    const cached = cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as Card;
    }

    try {
      const response = await fetch(`https://api.scryfall.com/cards/${id}`);

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Scryfall API error: ${response.status}`);
      }

      const data = await response.json();

      cache.set(cacheKey, {
        data,
        expiresAt: Date.now() + CACHE_TTL
      });

      return data;
    } catch (error) {
      console.error(`Erro ao buscar Scryfall card pelo ID (${id}):`, error);
      return null;
    }
  }
};
