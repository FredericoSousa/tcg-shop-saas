import { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { Product } from "@/lib/domain/entities/product";

interface ListProductsRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
}

export class ListProductsUseCase {
  constructor(private productRepo: IProductRepository) {}

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
