'use server'

import { scryfall } from '@/lib/scryfall'

export async function searchScryfallServer(query: string) {
  return scryfall.searchCards(query)
}
