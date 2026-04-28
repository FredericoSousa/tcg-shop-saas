import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../../infrastructure/container";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { Product } from "@/lib/domain/entities/product";
import { IUseCase } from "../use-case.interface";

@injectable()
export class GetProductUseCase implements IUseCase<string, Product | null> {
  constructor(@inject(TOKENS.ProductRepository) private productRepo: IProductRepository) {}

  async execute(id: string): Promise<Product | null> {
    return this.productRepo.findById(id);
  }
}
