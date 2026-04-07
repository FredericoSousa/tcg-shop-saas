import { Product, ProductCategory } from "../entities/product";

export interface IProductRepository {
  findById(id: string, tenantId: string): Promise<Product | null>;
  save(product: Product): Promise<Product>;
  update(id: string, tenantId: string, data: Partial<Product>): Promise<Product>;
  findPaginated(
    tenantId: string,
    page: number,
    limit: number,
    filters?: { search?: string; categoryId?: string }
  ): Promise<{ items: Product[]; total: number }>;
  decrementStock(id: string, tenantId: string, quantity: number): Promise<void>;
  
  // Categories
  findCategories(tenantId: string): Promise<ProductCategory[]>;
  findCategoryById(id: string, tenantId: string): Promise<ProductCategory | null>;
  saveCategory(category: ProductCategory): Promise<ProductCategory>;
  updateCategory(id: string, tenantId: string, data: Partial<ProductCategory>): Promise<ProductCategory>;
}
