import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { Product } from "@/lib/domain/entities/product";
import { IUseCase } from "./use-case.interface";

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

@injectable()
export class ListProductsUseCase implements IUseCase<ListProductsRequest, ListProductsResponse> {
  constructor(@inject(TOKENS.ProductRepository) private productRepo: IProductRepository) { }

  async execute(request: ListProductsRequest): Promise<ListProductsResponse> {
    const page = Math.max(1, request.page);
    const limit = Math.max(1, request.limit);
    const { search, categoryId } = request;
    const { items, total } = await this.productRepo.findPaginated(page, limit, { search, categoryId });

    return {
      items,
      total,
      pageCount: Math.ceil(total / limit) || 1,
    };
  }
}
