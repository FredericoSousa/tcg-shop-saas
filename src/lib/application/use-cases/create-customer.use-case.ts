import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Customer } from "@/lib/domain/entities/customer";
import { getTenantId } from "../../tenant-context";
import { IUseCase } from "./use-case.interface";

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

    return this.customerRepo.save({
      id: "",
      name,
      phoneNumber,
      email,
      tenantId: getTenantId()!,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }
}
