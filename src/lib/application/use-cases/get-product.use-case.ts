import { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { Product } from "@/lib/domain/entities/product";

export class GetProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string, tenantId: string): Promise<Product | null> {
    return this.productRepo.findById(id, tenantId);
  }
}
