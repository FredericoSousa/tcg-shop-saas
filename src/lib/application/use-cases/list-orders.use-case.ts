import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import { Order, OrderStatus, OrderSource } from "@/lib/domain/entities/order";

interface ListOrdersRequest {
  tenantId: string;
  page: number;
  limit: number;
  filters: {
    source?: OrderSource | "all";
    status?: OrderStatus | "all";
    search?: string;
    customerPhone?: string;
  };
}

@injectable()
export class ListOrdersUseCase {
  constructor(@inject(TOKENS.OrderRepository) private orderRepo: IOrderRepository) {}

  async execute(request: ListOrdersRequest): Promise<{ items: Order[]; total: number; pageCount: number }> {
    const { tenantId, page, limit, filters } = request;
    const { items, total } = await this.orderRepo.findPaginated(tenantId, page, limit, filters);
    
    return {
      items,
      total,
      pageCount: Math.ceil(total / limit),
    };
  }
}
