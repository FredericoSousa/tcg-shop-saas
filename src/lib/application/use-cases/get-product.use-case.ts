import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { Product } from "@/lib/domain/entities/product";

@injectable()
export class GetProductUseCase {
  constructor(@inject(TOKENS.ProductRepository) private productRepo: IProductRepository) {}

  async execute(id: string, tenantId: string): Promise<Product | null> {
    return this.productRepo.findById(id, tenantId);
  }
}
