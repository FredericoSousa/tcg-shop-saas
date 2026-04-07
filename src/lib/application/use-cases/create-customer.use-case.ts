import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Customer } from "@/lib/domain/entities/customer";

interface CreateCustomerRequest {
  tenantId: string;
  name: string;
  phoneNumber: string;
  email?: string | null;
}

@injectable()
export class CreateCustomerUseCase {
  constructor(@inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository) {}

  async execute(request: CreateCustomerRequest): Promise<Customer> {
    const { tenantId, name, phoneNumber, email = null } = request;

    return this.customerRepo.save({
      id: "",
      name,
      phoneNumber,
      email,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }
}
