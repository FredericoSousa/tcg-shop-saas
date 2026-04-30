import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Customer } from "@/lib/domain/entities/customer";
import { IUseCase } from "../use-case.interface";

@injectable()
export class LookupCustomerUseCase implements IUseCase<string, Customer | null> {
  constructor(@inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository) {}

  async execute(phoneNumber: string): Promise<Customer | null> {
    return this.customerRepo.findByPhoneNumber(phoneNumber);
  }
}
