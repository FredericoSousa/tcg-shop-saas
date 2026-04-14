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
}
