export interface CardTemplate {
  id: string;
  name: string;
  set: string;
  imageUrl: string | null;
  backImageUrl: string | null;
  game: string;
  metadata: Record<string, unknown> | null;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  cardTemplateId: string;
  price: number;
  quantity: number;
  condition: string;
  language: string;
  active: boolean;
  extras: string[];
  cardTemplate?: CardTemplate;
}
