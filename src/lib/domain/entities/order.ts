export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
export type OrderSource = "POS" | "ECOMMERCE";
export type PaymentMethodType = "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "TRANSFER" | "OTHER";

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

export interface OrderPayment {
  id: string;
  orderId: string;
  method: PaymentMethodType;
  amount: number;
  createdAt: Date;
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
  payments?: OrderPayment[];
  customer?: {
    name: string;
    phoneNumber: string;
  };
}
