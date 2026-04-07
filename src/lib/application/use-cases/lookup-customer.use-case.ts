import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Customer } from "@/lib/domain/entities/customer";

@injectable()
export class LookupCustomerUseCase {
  constructor(@inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository) {}

  async execute(phoneNumber: string, tenantId: string): Promise<Customer | null> {
    return this.customerRepo.findByPhoneNumber(phoneNumber, tenantId);
  }
}
