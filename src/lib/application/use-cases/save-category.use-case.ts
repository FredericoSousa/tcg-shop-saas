import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { ProductCategory } from "@/lib/domain/entities/product";
import { getTenantId } from "../../tenant-context";
import { IUseCase } from "./use-case.interface";

export interface SaveCategoryRequest {
  id?: string;
  name: string;
  description?: string | null;
  showOnEcommerce?: boolean;
}

@injectable()
export class SaveCategoryUseCase implements IUseCase<SaveCategoryRequest, ProductCategory> {
  constructor(@inject(TOKENS.ProductRepository) private productRepo: IProductRepository) {}

  async execute(request: SaveCategoryRequest): Promise<ProductCategory> {
    if (request.id) {
      return this.productRepo.updateCategory(request.id, {
        name: request.name,
        description: request.description,
        showOnEcommerce: request.showOnEcommerce,
      });
    }

    return this.productRepo.saveCategory({
      id: "",
      name: request.name,
      description: request.description || null,
      showOnEcommerce: request.showOnEcommerce ?? true,
      tenantId: getTenantId()!,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }
}
