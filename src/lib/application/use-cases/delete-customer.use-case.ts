import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { IUseCase } from "./use-case.interface";
import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";

export interface DeleteCustomerRequest {
  id: string;
}

@injectable()
export class DeleteCustomerUseCase implements IUseCase<DeleteCustomerRequest, void> {
  constructor(@inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository) {}

  async execute(request: DeleteCustomerRequest): Promise<void> {
    await this.customerRepo.delete(request.id);
    
    // Publish event
    domainEvents.publish(DOMAIN_EVENTS.CUSTOMER_DELETED, {
      customerId: request.id
    }).catch(err => console.error("Error publishing CUSTOMER_DELETED event:", err));
  }
}
