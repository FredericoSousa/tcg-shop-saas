import { Customer, CustomerStats } from "../entities/customer";

export interface ICustomerRepository {
  findById(id: string, tenantId: string): Promise<Customer | null>;
  findByPhoneNumber(phoneNumber: string, tenantId: string): Promise<Customer | null>;
  save(customer: Customer): Promise<Customer>;
  update(id: string, tenantId: string, data: Partial<Customer>): Promise<Customer>;
  findPaginated(
    tenantId: string, 
    page: number, 
    limit: number, 
    options?: { search?: string; includeDeleted?: boolean }
  ): Promise<{ items: Customer[]; total: number }>;
  getStats(id: string, tenantId: string): Promise<CustomerStats>;
  upsert(phoneNumber: string, tenantId: string, data: { name?: string; email?: string }): Promise<Customer>;
}
