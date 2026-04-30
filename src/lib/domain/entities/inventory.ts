export type Condition = "NM" | "SP" | "MP" | "HP" | "D";
export type Game = "MAGIC" | "POKEMON" | "YUGIOH";

/**
 * Subset of Scryfall card properties we keep in `card_templates.metadata`.
 * Restricted to the fields actually consumed by storefront filters and
 * UI — full Scryfall payloads are large and most fields are unused.
 */
export interface CardMetadata {
  color_identity?: string[];
  colors?: string[];
  type_line?: string;
  mana_cost?: string;
  oracle_text?: string;
  rarity?: string;
  cmc?: number;
  /** Anything else Scryfall returns (kept for forward compat). */
  [key: string]: unknown;
}

export interface CardTemplate {
  id: string;
  name: string;
  set: string;
  imageUrl: string | null;
  backImageUrl: string | null;
  game: Game;
  metadata: CardMetadata | null;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  cardTemplateId: string;
  price: number;
  quantity: number;
  condition: Condition;
  language: string;
  active: boolean;
  allowNegativeStock: boolean;
  extras: string[];
  cardTemplate?: CardTemplate;
}
