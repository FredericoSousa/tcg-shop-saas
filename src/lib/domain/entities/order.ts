export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
export type OrderSource = "POS" | "ECOMMERCE";
export type PaymentMethodType = "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "TRANSFER" | "STORE_CREDIT" | "OTHER";

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

/**
 * Order data interface — used for data transfer and persistence mapping.
 */
export interface Order {
  id: string;
  tenantId: string;
  customerId: string;
  totalAmount: number;
  status: OrderStatus;
  source: OrderSource;
  createdAt: Date;
  updatedAt: Date | null;
  friendlyId?: string | null;
  items?: OrderItem[];
  payments?: OrderPayment[];
  customer?: {
    name: string;
    phoneNumber: string;
  };
}

// ─── Domain Logic Helpers ──────────────────────────────────────────

const CANCELLABLE_STATUSES: OrderStatus[] = ["PENDING"];
const FINALIZABLE_STATUSES: OrderStatus[] = ["PENDING"];

/** Whether an order in the given status can be cancelled. */
export function canOrderBeCancelled(status: OrderStatus): boolean {
  return CANCELLABLE_STATUSES.includes(status);
}

/** Whether an order in the given status can be finalized (marked as paid). */
export function canOrderBeFinalized(status: OrderStatus): boolean {
  return FINALIZABLE_STATUSES.includes(status);
}

/** Calculate the sum of all item subtotals. */
export function calculateItemsTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);
}

/** Calculate the total amount already paid. */
export function calculatePaidAmount(payments: OrderPayment[]): number {
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

