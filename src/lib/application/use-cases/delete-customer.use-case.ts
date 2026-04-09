import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { IUseCase } from "./use-case.interface";

export interface DeleteCustomerRequest {
  id: string;
}

@injectable()
export class DeleteCustomerUseCase implements IUseCase<DeleteCustomerRequest, void> {
  constructor(@inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository) {}

  async execute(request: DeleteCustomerRequest): Promise<void> {
    await this.customerRepo.delete(request.id);
  }
}
