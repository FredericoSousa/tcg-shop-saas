import { ScryfallCard } from '@scryfall/api-types'
import { CircuitBreaker, retryWithBackoff } from './resilience/circuit-breaker'
import { logger } from './logger'

type Card = ScryfallCard.Any

const CACHE_TTL = 3600; // 1 hora de cache no edge

// Single shared breaker — Scryfall has one upstream we depend on, so a
// failure on /search and /collection are signals about the same host.
const breaker = new CircuitBreaker({
  name: "scryfall",
  failureThreshold: 5,
  windowMs: 30_000,
  cooldownMs: 30_000,
});

const RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 250;
const RETRY_MAX_MS = 2_000;

class ScryfallHttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ScryfallHttpError";
  }
}

function isRetriable(err: unknown): boolean {
  // Retry network errors and 5xx; never retry 4xx (we'd just hammer
  // the API with the same bad query).
  if (err instanceof ScryfallHttpError) return err.status >= 500;
  return true;
}

async function fetchScryfall(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  if (!response.ok && response.status >= 500) {
    throw new ScryfallHttpError(response.status, `Scryfall ${response.status}`);
  }
  return response;
}

export const scryfall = {
  /**
   * Busca cards baseados na sintaxe do Scryfall com persistencia distribuida do App Router
   */
  async searchCards(query: string): Promise<Card[]> {
    if (!query) return [];

    try {
      const response = await breaker.exec(() =>
        retryWithBackoff(
          () =>
            fetchScryfall(
              `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints&include_multilingual=true`,
              { next: { revalidate: CACHE_TTL, tags: ['scryfall-search', query.substring(0, 50)] } },
            ),
          { attempts: RETRY_ATTEMPTS, baseMs: RETRY_BASE_MS, maxMs: RETRY_MAX_MS, isRetriable },
        ),
      );

      if (!response.ok) {
        if (response.status === 404) return [];
        throw new ScryfallHttpError(response.status, `Scryfall ${response.status}`);
      }

      const data: { data?: Card[] } = await response.json();
      return data.data?.reduce((cards: Card[], card: Card) => {
        const alreadyExists = cards.find(c => c.set_id === card.set_id && c.name === card.name)
        if (!alreadyExists) return [...cards, card]
        return cards
      }, []) ?? [];
    } catch (error) {
      logger.warn("Scryfall searchCards failed", { action: "scryfall_search", error: (error as Error).message });
      return [];
    }
  },

  /**
   * Pega os detalhes exatos de um card pelo seu ID do Scryfall
   */
  async getCardById(id: string): Promise<Card | null> {
    try {
      const response = await breaker.exec(() =>
        retryWithBackoff(
          () =>
            fetchScryfall(`https://api.scryfall.com/cards/${id}`, {
              next: { revalidate: CACHE_TTL, tags: ['scryfall-card', id] },
            }),
          { attempts: RETRY_ATTEMPTS, baseMs: RETRY_BASE_MS, maxMs: RETRY_MAX_MS, isRetriable },
        ),
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new ScryfallHttpError(response.status, `Scryfall ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.warn("Scryfall getCardById failed", { action: "scryfall_get_by_id", scryfallId: id, error: (error as Error).message });
      return null;
    }
  },

  /**
   * Busca cards em lote no Scryfall. O endpoint aceita até 75 identificadores.
   * Divide a busca em chunks para acomodar arrays maiores protegendo o rate limit.
   */
  async getCardsCollection(identifiers: Array<{ id?: string, mtgo_id?: number, multiverse_id?: number, oracle_id?: string, illustration_id?: string, name?: string, set?: string, collector_number?: string }>): Promise<Card[]> {
    if (!identifiers || identifiers.length === 0) return [];

    const MAX_CHUNK = 75;
    const results: Card[] = [];

    for (let i = 0; i < identifiers.length; i += MAX_CHUNK) {
      const chunk = identifiers.slice(i, i + MAX_CHUNK);

      try {
        const response = await breaker.exec(() =>
          retryWithBackoff(
            () =>
              fetchScryfall('https://api.scryfall.com/cards/collection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifiers: chunk }),
              }),
            { attempts: RETRY_ATTEMPTS, baseMs: RETRY_BASE_MS, maxMs: RETRY_MAX_MS, isRetriable },
          ),
        );

        if (!response.ok) {
          logger.warn("Scryfall collection chunk failed", {
            action: "scryfall_collection",
            status: response.status,
          });
        } else {
          const data = await response.json();
          if (data.data) results.push(...data.data);
        }
      } catch (error) {
        logger.warn("Scryfall collection chunk threw", {
          action: "scryfall_collection",
          error: (error as Error).message,
        });
      }

      if (i + MAX_CHUNK < identifiers.length) {
         await new Promise(r => setTimeout(r, 100)); // Rate limit pause
      }
    }

    return results;
  },

  /** Test seam: reset breaker between unit tests. */
  __resetBreakerForTests(): void {
    breaker.reset();
  },
};
