import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import { Order, OrderStatus, OrderSource } from "@/lib/domain/entities/order";
import { IUseCase } from "../use-case.interface";

export interface ListOrdersRequest {
  page: number;
  limit: number;
  filters: {
    source?: OrderSource | "all";
    status?: OrderStatus | "all";
    search?: string;
    customerPhone?: string;
    customerId?: string;
  };
}

export interface ListOrdersResponse {
  items: Order[];
  total: number;
  pageCount: number;
}

@injectable()
export class ListOrdersUseCase implements IUseCase<ListOrdersRequest, ListOrdersResponse> {
  constructor(@inject(TOKENS.OrderRepository) private orderRepo: IOrderRepository) {}

  async execute(request: ListOrdersRequest): Promise<ListOrdersResponse> {
    const page = Math.max(1, request.page);
    const limit = Math.max(1, request.limit);
    const { filters } = request;
    
    const { items, total } = await this.orderRepo.findPaginated(page, limit, filters);
    
    return {
      items,
      total,
      pageCount: Math.ceil(total / limit),
    };
  }
}
