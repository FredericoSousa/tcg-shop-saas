import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { ProductCategory } from "@/lib/domain/entities/product";

@injectable()
export class ListCategoriesUseCase {
  constructor(@inject(TOKENS.ProductRepository) private productRepo: IProductRepository) {}

  async execute(): Promise<ProductCategory[]> {
    return this.productRepo.findCategories();
  }
}
