import { InventoryItem, CardTemplate } from "../entities/inventory";

export interface IInventoryRepository {
  findById(id: string): Promise<InventoryItem | null>;
  findByTemplate(templateId: string, filters: Partial<InventoryItem>): Promise<InventoryItem | null>;
  save(item: InventoryItem): Promise<InventoryItem>;
  update(id: string, data: Partial<InventoryItem>): Promise<InventoryItem>;
  deleteMany(ids: string[]): Promise<void>;
  findPaginated(page: number, limit: number, search?: string): Promise<{ items: InventoryItem[], total: number }>;
  decrementStock(id: string, quantity: number): Promise<void>;
}

export interface ICardTemplateRepository {
  findById(id: string): Promise<CardTemplate | null>;
  save(template: CardTemplate): Promise<CardTemplate>;
}
