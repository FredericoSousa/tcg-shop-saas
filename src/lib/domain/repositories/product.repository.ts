import { Product, ProductCategory } from "../entities/product";

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  save(product: Product): Promise<Product>;
  update(id: string, data: Partial<Product>): Promise<Product>;
  findPaginated(
    page: number,
    limit: number,
    filters?: { search?: string; categoryId?: string }
  ): Promise<{ items: Product[]; total: number }>;
  decrementStock(id: string, quantity: number): Promise<void>;

  // Categories
  findCategories(): Promise<ProductCategory[]>;
  findCategoryById(id: string): Promise<ProductCategory | null>;
  saveCategory(category: ProductCategory): Promise<ProductCategory>;
  updateCategory(id: string, data: Partial<ProductCategory>): Promise<ProductCategory>;
}
