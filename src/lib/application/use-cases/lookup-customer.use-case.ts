import { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Customer } from "@/lib/domain/entities/customer";

export class LookupCustomerUseCase {
  constructor(private customerRepo: ICustomerRepository) {}

  async execute(phoneNumber: string, tenantId: string): Promise<Customer | null> {
    return this.customerRepo.findByPhoneNumber(phoneNumber, tenantId);
  }
}
