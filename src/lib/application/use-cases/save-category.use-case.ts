import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { ProductCategory } from "@/lib/domain/entities/product";

interface SaveCategoryRequest {
  id?: string;
  tenantId: string;
  name: string;
  description?: string | null;
  showOnEcommerce?: boolean;
}

@injectable()
export class SaveCategoryUseCase {
  constructor(@inject(TOKENS.ProductRepository) private productRepo: IProductRepository) {}

  async execute(request: SaveCategoryRequest): Promise<ProductCategory> {
    if (request.id) {
      return this.productRepo.updateCategory(request.id, request.tenantId, {
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
      tenantId: request.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }
}
