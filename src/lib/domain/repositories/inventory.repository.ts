import { InventoryItem, CardTemplate } from "../entities/inventory";

export type StorefrontSortOption = 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';

export interface StorefrontFilters {
  search?: string;
  set?: string;
  language?: string | string[];
  /** Scryfall color identity codes — `C` represents colorless. */
  color?: string | string[];
  /** Card type tokens (matched against `type_line`). */
  type?: string | string[];
  /** Subtypes (the segment after the em-dash in `type_line`). */
  subtype?: string | string[];
  /** Inventory-level extras (foil, signed, …). */
  extras?: string | string[];
  sort?: StorefrontSortOption;
}

export interface IInventoryRepository {
  findById(id: string): Promise<InventoryItem | null>;
  findByTemplate(templateId: string, filters: Partial<InventoryItem>): Promise<InventoryItem | null>;
  findManyByTemplates(templateIds: string[], tenantId: string): Promise<InventoryItem[]>;
  save(item: InventoryItem): Promise<InventoryItem>;
  createMany(items: InventoryItem[]): Promise<void>;
  update(id: string, data: Partial<InventoryItem>): Promise<InventoryItem>;
  updateMany(ids: string[], data: Partial<InventoryItem>): Promise<void>;
  deactivateMany(ids: string[]): Promise<void>;
  findPaginated(page: number, limit: number, search?: string): Promise<{ items: InventoryItem[], total: number }>;
  findStorefrontItems(tenantId: string, page: number, limit: number, filters?: StorefrontFilters): Promise<{ items: InventoryItem[], total: number }>;
  /** Lightweight name lookup for live search. */
  searchStorefront(tenantId: string, query: string, limit: number): Promise<InventoryItem[]>;
  findAllActive(tenantId: string): Promise<InventoryItem[]>;
  countActive(tenantId: string): Promise<number>;
  decrementStock(id: string, quantity: number, tx?: unknown): Promise<void>;
  /**
   * Atomically increments stock for an inventory item that matches
   * (tenantId, cardTemplateId, condition, language) — creating it if
   * not present. Used by buylist approval to add purchased cards to
   * stock in a single round-trip per item.
   */
  upsertStockForBuylist(
    args: {
      tenantId: string;
      cardTemplateId: string;
      condition: string;
      language: string;
      quantity: number;
      defaultPrice: number;
    },
    tx?: unknown,
  ): Promise<void>;
}

export interface ICardTemplateRepository {
  findById(id: string): Promise<CardTemplate | null>;
  findByIds(ids: string[]): Promise<CardTemplate[]>;
  save(template: CardTemplate): Promise<CardTemplate>;
  createMany(templates: CardTemplate[]): Promise<void>;
}
