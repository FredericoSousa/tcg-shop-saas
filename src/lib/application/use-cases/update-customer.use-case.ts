import { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Customer } from "@/lib/domain/entities/customer";

interface UpdateCustomerRequest {
  id: string;
  tenantId: string;
  name?: string;
  phoneNumber?: string;
  email?: string | null;
  deletedAt?: Date | null;
}

export class UpdateCustomerUseCase {
  constructor(private customerRepo: ICustomerRepository) {}

  async execute(request: UpdateCustomerRequest): Promise<Customer> {
    const { id, tenantId, ...data } = request;
    return this.customerRepo.update(id, tenantId, data);
  }
}
