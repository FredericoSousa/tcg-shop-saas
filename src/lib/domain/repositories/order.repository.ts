import { Order, OrderStatus, OrderSource, OrderItem, PaymentMethodType } from "../entities/order";
import { Customer } from "../entities/customer";

export type OrderRelation = Order & {
  items?: OrderItem[];
  customer?: Customer | null;
};

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order, items: Omit<OrderItem, "id" | "orderId">[], tx?: unknown): Promise<Order>;
  updateStatus(id: string, status: OrderStatus, tx?: unknown): Promise<void>;
  savePayments(orderId: string, payments: { method: PaymentMethodType; amount: number }[], tx?: unknown): Promise<void>;
  findPaginated(
    page: number,
    limit: number,
    filters?: {
      status?: OrderStatus | "all";
      source?: OrderSource | "all";
      search?: string;
      customerPhone?: string;
      customerId?: string;
    }
  ): Promise<{ items: Order[]; total: number }>;
  findPendingPOSOrder(customerId: string, tx?: unknown): Promise<Order | null>;
  appendToOrder(orderId: string, items: { productId: string; quantity: number; priceAtPurchase: number }[], totalAmountIncrement: number, tx?: unknown): Promise<void>;
}
