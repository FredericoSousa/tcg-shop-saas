import { Order, OrderStatus, OrderSource } from "../entities/order";

export interface IOrderRepository {
  findById(id: string, tenantId: string): Promise<Order | null>;
  save(order: Order, items: Omit<any, "id" | "orderId">[]): Promise<Order>;
  updateStatus(id: string, tenantId: string, status: OrderStatus): Promise<void>;
  findPaginated(
    tenantId: string,
    page: number,
    limit: number,
    filters?: {
      status?: OrderStatus | "all";
      source?: OrderSource | "all";
      search?: string;
      customerPhone?: string;
    }
  ): Promise<{ items: Order[]; total: number }>;
}
