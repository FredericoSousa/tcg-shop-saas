import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { Product } from "@/lib/domain/entities/product";
import { getTenantId } from "../../tenant-context";
import { IUseCase } from "./use-case.interface";

export interface SaveProductRequest {
  id?: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  stock: number;
  categoryId: string;
  active?: boolean;
}

@injectable()
export class SaveProductUseCase implements IUseCase<SaveProductRequest, Product> {
  constructor(@inject(TOKENS.ProductRepository) private productRepo: IProductRepository) {}

  async execute(request: SaveProductRequest): Promise<Product> {
    if (request.id) {
      return this.productRepo.update(request.id, {
        name: request.name,
        description: request.description,
        imageUrl: request.imageUrl,
        price: request.price,
        stock: request.stock,
        categoryId: request.categoryId,
        active: request.active,
      });
    }

    return this.productRepo.save({
      id: "",
      name: request.name,
      description: request.description || null,
      imageUrl: request.imageUrl || null,
      price: request.price,
      stock: request.stock,
      categoryId: request.categoryId,
      active: true,
      tenantId: getTenantId()!,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }
}
