import { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { ProductCategory } from "@/lib/domain/entities/product";

export class ListCategoriesUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(tenantId: string): Promise<ProductCategory[]> {
    return this.productRepo.findCategories(tenantId);
  }
}
