import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { ProductCategory } from "@/lib/domain/entities/product";
import { getTenantId } from "@/lib/tenant-context";
import { IUseCase } from "../use-case.interface";

import { z } from "zod";

export const SaveCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "O nome da categoria é obrigatório"),
  description: z.string().nullable().optional(),
  showOnEcommerce: z.boolean().optional(),
});

export type SaveCategoryRequest = z.infer<typeof SaveCategorySchema>;

@injectable()
export class SaveCategoryUseCase implements IUseCase<SaveCategoryRequest, ProductCategory> {
  constructor(@inject(TOKENS.ProductRepository) private productRepo: IProductRepository) {}

  async execute(request: SaveCategoryRequest): Promise<ProductCategory> {
    const validatedRequest = SaveCategorySchema.parse(request);

    if (validatedRequest.id) {
      return this.productRepo.updateCategory(validatedRequest.id, {
        name: validatedRequest.name,
        description: validatedRequest.description,
        showOnEcommerce: validatedRequest.showOnEcommerce,
      });
    }

    return this.productRepo.saveCategory({
      id: "",
      name: validatedRequest.name,
      description: validatedRequest.description || null,
      showOnEcommerce: validatedRequest.showOnEcommerce ?? true,
      tenantId: getTenantId()!,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }
}
