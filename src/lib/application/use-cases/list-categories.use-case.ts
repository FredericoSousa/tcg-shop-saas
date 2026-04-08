import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { ProductCategory } from "@/lib/domain/entities/product";
import { IUseCase } from "./use-case.interface";

@injectable()
export class ListCategoriesUseCase implements IUseCase<void, ProductCategory[]> {
  constructor(@inject(TOKENS.ProductRepository) private productRepo: IProductRepository) {}

  async execute(): Promise<ProductCategory[]> {
    return this.productRepo.findCategories();
  }
}
