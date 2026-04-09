import { InventoryItem, CardTemplate } from "../entities/inventory";

export interface IInventoryRepository {
  findById(id: string): Promise<InventoryItem | null>;
  findByTemplate(templateId: string, filters: Partial<InventoryItem>): Promise<InventoryItem | null>;
  findManyByTemplates(templateIds: string[], tenantId: string): Promise<InventoryItem[]>;
  save(item: InventoryItem): Promise<InventoryItem>;
  createMany(items: InventoryItem[]): Promise<void>;
  update(id: string, data: Partial<InventoryItem>): Promise<InventoryItem>;
  updateMany(ids: string[], data: Partial<InventoryItem>): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
  findPaginated(page: number, limit: number, search?: string): Promise<{ items: InventoryItem[], total: number }>;
  countActive(tenantId: string): Promise<number>;
  decrementStock(id: string, quantity: number): Promise<void>;
}

export interface ICardTemplateRepository {
  findById(id: string): Promise<CardTemplate | null>;
  findByIds(ids: string[]): Promise<CardTemplate[]>;
  save(template: CardTemplate): Promise<CardTemplate>;
  createMany(templates: CardTemplate[]): Promise<void>;
}
