import { InventoryItem, CardTemplate } from "../entities/inventory";

export interface IInventoryRepository {
  findById(id: string, tenantId: string): Promise<InventoryItem | null>;
  findByTemplate(tenantId: string, templateId: string, filters: Partial<InventoryItem>): Promise<InventoryItem | null>;
  save(item: InventoryItem): Promise<InventoryItem>;
  update(id: string, tenantId: string, data: Partial<InventoryItem>): Promise<InventoryItem>;
  deleteMany(ids: string[], tenantId: string): Promise<void>;
  findPaginated(tenantId: string, page: number, limit: number, search?: string): Promise<{ items: InventoryItem[], total: number }>;
  decrementStock(id: string, tenantId: string, quantity: number): Promise<void>;
}

export interface ICardTemplateRepository {
  findById(id: string): Promise<CardTemplate | null>;
  save(template: CardTemplate): Promise<CardTemplate>;
}
