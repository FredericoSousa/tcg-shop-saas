import { CustomerCreditLedger } from "../entities/customer-credit-ledger";

export interface ICustomerCreditLedgerRepository {
  save(ledger: Omit<CustomerCreditLedger, "id" | "createdAt">, tx?: any): Promise<CustomerCreditLedger>;
  findByCustomerId(customerId: string): Promise<CustomerCreditLedger[]>;
  findByOrderId(orderId: string): Promise<CustomerCreditLedger[]>;
}
