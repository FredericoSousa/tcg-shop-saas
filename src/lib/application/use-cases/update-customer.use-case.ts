import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Customer } from "@/lib/domain/entities/customer";

interface UpdateCustomerRequest {
  id: string;
  tenantId: string;
  name?: string;
  phoneNumber?: string;
  email?: string | null;
  deletedAt?: Date | null;
}

@injectable()
export class UpdateCustomerUseCase {
  constructor(@inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository) {}

  async execute(request: UpdateCustomerRequest): Promise<Customer> {
    const { id, tenantId, ...data } = request;
    return this.customerRepo.update(id, tenantId, data);
  }
}
