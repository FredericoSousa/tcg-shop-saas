/**
 * LigaMagic library - now using improved scraper
 * This file maintains backward compatibility while delegating to the new scraper
 */

import { getCollectionById as scrapeCollection } from "./scrapers/ligaMagicScraper";
import {
  LIGAMAGIC_CONDITIONS,
  LIGAMAGIC_LANGUAGES,
  LIGAMAGIC_EXTRAS,
} from "./constants/cardMappings";

export type CollectionCard = {
  quantity: number;
  name: string;
  set: string;
  cardNumber: string;
  price: number;
  language?: string;
  condition?: string;
  extras: string[];
};

/**
 * Get collection by ID - delegates to improved scraper
 */
export async function getCollectionById(id: string): Promise<CollectionCard[]> {
  return scrapeCollection(id);
}

// Export conditions, languages, and extras for backward compatibility
export const ligaMagicConditions = LIGAMAGIC_CONDITIONS;
export const ligaMagicLanguages = LIGAMAGIC_LANGUAGES;
export const ligamagicExtras = LIGAMAGIC_EXTRAS;
