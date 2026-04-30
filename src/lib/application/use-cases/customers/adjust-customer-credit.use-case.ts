import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { getTenantId } from "@/lib/tenant-context";
import { IUseCase } from "../use-case.interface";
import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";
import {
  EntityNotFoundError,
  InsufficientFundsError,
} from "@/lib/domain/errors/domain.error";

export interface AdjustCustomerCreditRequest {
  customerId: string;
  amount: number; // Positive for credit, negative for debit
  description: string;
}

export interface AdjustCustomerCreditResponse {
  success: boolean;
  newBalance: number;
}

@injectable()
export class AdjustCustomerCreditUseCase
  implements IUseCase<AdjustCustomerCreditRequest, AdjustCustomerCreditResponse>
{
  constructor(
    @inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository,
  ) {}

  async execute(request: AdjustCustomerCreditRequest): Promise<AdjustCustomerCreditResponse> {
    const { customerId, amount, description } = request;
    const tenantId = getTenantId()!;

    if (amount < 0) {
      const debited = await this.customerRepo.tryDebitCredit(customerId, -amount);
      if (!debited) {
        // The customer either does not exist or has an insufficient
        // balance — disambiguate with one cheap lookup.
        const customer = await this.customerRepo.findById(customerId);
        if (!customer) throw new EntityNotFoundError("Cliente", customerId);
        throw new InsufficientFundsError("Saldo insuficiente de créditos.");
      }
    } else {
      const customer = await this.customerRepo.findById(customerId);
      if (!customer) throw new EntityNotFoundError("Cliente", customerId);
      await this.customerRepo.updateCreditBalance(customerId, amount);
    }

    // Read-back is the only authoritative new balance after a concurrent-safe debit.
    const fresh = await this.customerRepo.findById(customerId);
    const newBalance = fresh?.creditBalance ?? 0;

    domainEvents.publish(DOMAIN_EVENTS.CUSTOMER_CREDIT_ADJUSTED, {
      customerId,
      tenantId,
      amount,
      newBalance,
      description,
      source: "MANUAL",
    }).catch(err => console.error("Error publishing CUSTOMER_CREDIT_ADJUSTED:", err));

    return { success: true, newBalance };
  }
}
