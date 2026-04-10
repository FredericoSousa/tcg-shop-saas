export type CreditLedgerType = "CREDIT" | "DEBIT";
export type CreditLedgerSource = "MANUAL" | "ORDER_PAYMENT" | "ORDER_REFUND";

export interface CustomerCreditLedger {
  id: string;
  tenantId: string;
  customerId: string;
  orderId: string | null;
  orderFriendlyId?: string | null;
  amount: number;
  type: CreditLedgerType;
  source: CreditLedgerSource;
  description: string | null;
  createdAt: Date;
}
