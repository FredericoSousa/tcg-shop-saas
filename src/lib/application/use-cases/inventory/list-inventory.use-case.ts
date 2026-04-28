import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../../infrastructure/container";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import { InventoryItem } from "@/lib/domain/entities/inventory";
import { IUseCase } from "../use-case.interface";

export interface ListInventoryRequest {
  page: number;
  limit: number;
  search?: string;
}

export interface ListInventoryResponse {
  items: InventoryItem[];
  total: number;
  pageCount: number;
}

@injectable()
export class ListInventoryUseCase implements IUseCase<ListInventoryRequest, ListInventoryResponse> {
  constructor(@inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository) {}

  async execute(request: ListInventoryRequest): Promise<ListInventoryResponse> {
    const page = Math.max(1, request.page);
    const limit = Math.max(1, request.limit);
    const { search } = request;
    
    const { items, total } = await this.inventoryRepo.findPaginated(page, limit, search);
    
    return {
      items,
      total,
      pageCount: Math.ceil(total / limit) || 1,
    };
  }
}
