import { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { Product } from "@/lib/domain/entities/product";

interface SaveProductRequest {
  id?: string;
  tenantId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  stock: number;
  categoryId: string;
  active?: boolean;
}

export class SaveProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(request: SaveProductRequest): Promise<Product> {
    if (request.id) {
      return this.productRepo.update(request.id, request.tenantId, {
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
      tenantId: request.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }
}
