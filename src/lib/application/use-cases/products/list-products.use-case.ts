import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { Product } from "@/lib/domain/entities/product";
import { IUseCase } from "../use-case.interface";
import { z } from "zod";

export interface ListProductsRequest {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
}

export interface ListProductsResponse {
  items: Product[];
  total: number;
  pageCount: number;
}

const ListProductsRequestSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  categoryId: z.string().optional(),
});

@injectable()
export class ListProductsUseCase implements IUseCase<ListProductsRequest, ListProductsResponse> {
  constructor(@inject(TOKENS.ProductRepository) private productRepo: IProductRepository) { }

  async execute(request: ListProductsRequest): Promise<ListProductsResponse> {
    const { page, limit, search, categoryId } = ListProductsRequestSchema.parse(request);
    
    const { items, total } = await this.productRepo.findPaginated(page, limit, { search, categoryId });

    return {
      items,
      total,
      pageCount: Math.ceil(total / limit) || 1,
    };
  }
}
