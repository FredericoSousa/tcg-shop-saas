export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
export type OrderSource = "POS" | "ECOMMERCE";

export interface OrderItem {
  id: string;
  orderId: string;
  inventoryItemId?: string | null;
  productId?: string | null;
  quantity: number;
  priceAtPurchase: number;
  // Relations for UI
  inventoryItem?: {
    cardTemplate?: {
      imageUrl: string | null;
    };
  };
  product?: {
    imageUrl: string | null;
  };
}

export interface Order {
  id: string;
  tenantId: string;
  customerId: string;
  totalAmount: number;
  status: OrderStatus;
  source: OrderSource;
  createdAt: Date;
  updatedAt: Date | null;
  items?: OrderItem[];
  customer?: {
    name: string;
    phoneNumber: string;
  };
}
