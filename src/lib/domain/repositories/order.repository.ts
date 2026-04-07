import { Order, OrderStatus, OrderSource, OrderItem } from "../entities/order";
import { Customer } from "../entities/customer";

export type OrderRelation = Order & {
  items?: OrderItem[];
  customer?: Customer | null;
};

export interface IOrderRepository {
  findById(id: string, tenantId: string): Promise<Order | null>;
  save(order: Order, items: Omit<OrderItem, "id" | "orderId">[]): Promise<Order>;
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
  findPendingPOSOrder(customerId: string, tenantId: string): Promise<Order | null>;
  appendToOrder(orderId: string, items: { productId: string; quantity: number; priceAtPurchase: number }[], totalAmountIncrement: number): Promise<void>;
}
