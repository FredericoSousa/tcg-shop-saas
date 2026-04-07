import { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Customer, CustomerStats } from "@/lib/domain/entities/customer";

export class GetCustomerUseCase {
  constructor(private customerRepo: ICustomerRepository) {}

  async execute(id: string, tenantId: string): Promise<{ customer: Customer; stats: CustomerStats } | null> {
    const customer = await this.customerRepo.findById(id, tenantId);
    if (!customer) return null;

    const stats = await this.customerRepo.getStats(id, tenantId);
    return { customer, stats };
  }
}
