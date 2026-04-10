import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { Product } from "@/lib/domain/entities/product";
import { getTenantId } from "../../tenant-context";
import { IUseCase } from "./use-case.interface";

import { z } from "zod";

export const SaveProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "O nome é obrigatório"),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url("URL da imagem inválida").nullable().optional().or(z.string().length(0)),
  price: z.number().positive("O preço deve ser superior a zero"),
  stock: z.number().int().min(0, "O estoque não pode ser negativo"),
  categoryId: z.string().min(1, "A categoria é obrigatória"),
  active: z.boolean().optional(),
  allowNegativeStock: z.boolean().optional().default(false),
});

export type SaveProductRequest = z.infer<typeof SaveProductSchema>;

@injectable()
export class SaveProductUseCase implements IUseCase<SaveProductRequest, Product> {
  constructor(@inject(TOKENS.ProductRepository) private productRepo: IProductRepository) { }

  async execute(request: SaveProductRequest): Promise<Product> {
    const validatedRequest = SaveProductSchema.parse(request);

    if (validatedRequest.id) {
      return this.productRepo.update(validatedRequest.id, {
        name: validatedRequest.name,
        description: validatedRequest.description,
        imageUrl: validatedRequest.imageUrl,
        price: validatedRequest.price,
        stock: validatedRequest.stock,
        categoryId: validatedRequest.categoryId,
        active: validatedRequest.active,
        allowNegativeStock: validatedRequest.allowNegativeStock,
      });
    }

    return this.productRepo.save({
      id: "",
      name: validatedRequest.name,
      description: validatedRequest.description || null,
      imageUrl: validatedRequest.imageUrl || null,
      price: validatedRequest.price,
      stock: validatedRequest.stock,
      categoryId: validatedRequest.categoryId,
      active: true,
      allowNegativeStock: validatedRequest.allowNegativeStock,
      tenantId: getTenantId()!,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }
}
