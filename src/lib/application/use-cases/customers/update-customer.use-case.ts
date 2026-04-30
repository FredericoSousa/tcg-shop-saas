import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Customer } from "@/lib/domain/entities/customer";
import { IUseCase } from "../use-case.interface";

export interface UpdateCustomerRequest {
  id: string;
  name?: string;
  phoneNumber?: string;
  email?: string | null;
  deletedAt?: Date | null;
}

@injectable()
export class UpdateCustomerUseCase implements IUseCase<UpdateCustomerRequest, Customer> {
  constructor(@inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository) {}

  async execute(request: UpdateCustomerRequest): Promise<Customer> {
    const { id, ...data } = request;
    return this.customerRepo.update(id, data);
  }
}
