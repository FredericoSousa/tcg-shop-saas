import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Customer } from "@/lib/domain/entities/customer";
import { getTenantId } from "@/lib/tenant-context";
import { IUseCase } from "../use-case.interface";

export interface CreateCustomerRequest {
  name: string;
  phoneNumber: string;
  email?: string | null;
}

@injectable()
export class CreateCustomerUseCase implements IUseCase<CreateCustomerRequest, Customer> {
  constructor(@inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository) {}

  async execute(request: CreateCustomerRequest): Promise<Customer> {
    const { name, phoneNumber, email = null } = request;

    const customer: Customer = {
      id: "",
      name,
      phoneNumber,
      email,
      tenantId: getTenantId()!,
      creditBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    return this.customerRepo.save(customer);
  }
}
