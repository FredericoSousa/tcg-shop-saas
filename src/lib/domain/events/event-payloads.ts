import { PaymentMethodType } from "@/lib/domain/entities/order";
import { CreditLedgerSource } from "@/lib/domain/entities/customer-credit-ledger";

export interface OrderPlacedPayload {
  orderId: string;
  tenantId: string;
  customerId: string;
  items: {
    productId?: string;
    inventoryId?: string;
    quantity: number;
    price: number;
  }[];
}

export interface OrderPaidPayload {
  orderId: string;
  tenantId: string;
  customerId: string;
  totalAmount: number;
  payments: {
    method: PaymentMethodType;
    amount: number;
  }[];
}

export interface CustomerCreditAdjustedPayload {
  customerId: string;
  tenantId: string;
  amount: number;
  newBalance: number;
  description: string;
  source?: CreditLedgerSource;
  orderId?: string;
}

export interface ProductSavedPayload {
  productId: string;
  tenantId: string;
  name: string;
  isNew: boolean;
}

export interface BuylistApprovedPayload {
  proposalId: string;
  tenantId: string;
  customerId: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  paymentMethod: string;
}

export interface InventoryUpdatedPayload {
  tenantId: string;
  cardIds?: string[]; // Scryfall IDs
  inventoryIds?: string[]; // IDs from the inventory table
  source?: string;
}

export interface InventoryDeletedPayload {
  tenantId: string;
  inventoryIds: string[];
}
