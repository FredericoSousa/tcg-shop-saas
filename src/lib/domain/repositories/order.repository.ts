import { Order, OrderStatus, OrderSource, OrderItem, PaymentMethodType } from "../entities/order";
import { Customer } from "../entities/customer";

export type OrderRelation = Order & {
  items?: OrderItem[];
  customer?: Customer | null;
};

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order, items: Omit<OrderItem, "id" | "orderId">[]): Promise<Order>;
  updateStatus(id: string, status: OrderStatus, tx?: any): Promise<void>;
  savePayments(orderId: string, payments: { method: PaymentMethodType; amount: number }[], tx?: any): Promise<void>;
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
  findPendingPOSOrder(customerId: string): Promise<Order | null>;
  appendToOrder(orderId: string, items: { productId: string; quantity: number; priceAtPurchase: number }[], totalAmountIncrement: number): Promise<void>;
}
