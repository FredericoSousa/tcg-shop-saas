import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Customer, CustomerStats } from "@/lib/domain/entities/customer";
import { IUseCase } from "./use-case.interface";

@injectable()
export class GetCustomerUseCase implements IUseCase<string, { customer: Customer; stats: CustomerStats } | null> {
  constructor(@inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository) {}

  async execute(id: string): Promise<{ customer: Customer; stats: CustomerStats } | null> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) return null;

    const stats = await this.customerRepo.getStats(id);
    return { customer, stats };
  }
}
