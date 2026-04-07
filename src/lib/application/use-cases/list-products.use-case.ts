import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { Product } from "@/lib/domain/entities/product";

interface ListProductsRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
}

@injectable()
export class ListProductsUseCase {
  constructor(@inject(TOKENS.ProductRepository) private productRepo: IProductRepository) {}

  async execute(request: ListProductsRequest): Promise<{ items: Product[]; total: number; pageCount: number }> {
    const { tenantId, page, limit, search, categoryId } = request;
    const { items, total } = await this.productRepo.findPaginated(tenantId, page, limit, { search, categoryId });
    
    return {
      items,
      total,
      pageCount: Math.ceil(total / limit),
    };
  }
}
