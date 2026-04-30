import { Customer, CustomerStats } from "../entities/customer";

export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByPhoneNumber(phoneNumber: string): Promise<Customer | null>;
  save(customer: Customer): Promise<Customer>;
  update(id: string, data: Partial<Customer>): Promise<Customer>;
  findPaginated(
    page: number, 
    limit: number, 
    options?: { search?: string; includeDeleted?: boolean }
  ): Promise<{ items: Customer[]; total: number }>;
  getStats(id: string): Promise<CustomerStats>;
  upsert(phoneNumber: string, data: { name?: string; email?: string }, tx?: unknown): Promise<Customer>;
  delete(id: string): Promise<void>;
  updateCreditBalance(id: string, amount: number, tx?: unknown): Promise<void>;
  /**
   * Atomically debits the customer's credit balance. Returns false if
   * the balance is insufficient — the caller should map this to a
   * domain error. Avoids the read-modify-write race that
   * `updateCreditBalance` cannot prevent on its own.
   */
  tryDebitCredit(id: string, amount: number, tx?: unknown): Promise<boolean>;
  /**
   * GDPR/LGPD right-to-erasure: replaces every PII column with a
   * synthetic value and marks the row deleted. Orders/ledger keep the
   * FK so accounting reports stay consistent, but they no longer
   * resolve to a real person.
   */
  anonymise(id: string, tx?: unknown): Promise<void>;
}
