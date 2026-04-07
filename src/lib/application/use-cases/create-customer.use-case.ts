import { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Customer } from "@/lib/domain/entities/customer";

interface CreateCustomerRequest {
  tenantId: string;
  name: string;
  phoneNumber: string;
  email?: string | null;
}

export class CreateCustomerUseCase {
  constructor(private customerRepo: ICustomerRepository) {}

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
