import { IOrderRepository } from "@/lib/domain/repositories/order.repository";
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

export class ListOrdersUseCase {
  constructor(private orderRepo: IOrderRepository) {}

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
