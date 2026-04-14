import { ScryfallCard } from '@scryfall/api-types'

type Card = ScryfallCard.Any

const CACHE_TTL = 3600; // 1 hora de cache no edge

export const scryfall = {
  /**
   * Busca cards baseados na sintaxe do Scryfall com persistencia distribuida do App Router
   */
  async searchCards(query: string): Promise<Card[]> {
    if (!query) return [];

    try {
      const response = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints&include_multilingual=true`,
        { next: { revalidate: CACHE_TTL, tags: ['scryfall-search', query.substring(0, 50)] } }
      );

      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`Scryfall API error: ${response.status}`);
      }

      const data: { data?: Card[] } = await response.json();
      return data.data?.reduce((cards: Card[], card: Card) => {
        const alreadyExists = cards.find(c => c.set_id === card.set_id && c.name === card.name)
        if (!alreadyExists) return [...cards, card]
        return cards
      }, []) ?? [];
    } catch (error) {
      console.error('Erro na busca do Scryfall:', error);
      return [];
    }
  },

  /**
   * Pega os detalhes exatos de um card pelo seu ID do Scryfall
   */
  async getCardById(id: string): Promise<Card | null> {
    try {
      const response = await fetch(`https://api.scryfall.com/cards/${id}`, {
        next: { revalidate: CACHE_TTL, tags: ['scryfall-card', id] }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Scryfall API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro ao buscar Scryfall card pelo ID (${id}):`, error);
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
        const response = await fetch('https://api.scryfall.com/cards/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifiers: chunk })
        });

        if (!response.ok) {
          console.error(`Scryfall API error on collection fetch: ${response.status}`);
        } else {
          const data = await response.json();
          if (data.data) results.push(...data.data);
        }
      } catch (error) {
        console.error('Erro na busca em lote do Scryfall:', error);
      }
      
      if (i + MAX_CHUNK < identifiers.length) {
         await new Promise(r => setTimeout(r, 100)); // Rate limit pause
      }
    }

    return results;
  }
};
