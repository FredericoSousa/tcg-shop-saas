import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../../infrastructure/container";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { getTenantId } from "../../../tenant-context";
import { IUseCase } from "../use-case.interface";
import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";

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
export class AdjustCustomerCreditUseCase implements IUseCase<AdjustCustomerCreditRequest, AdjustCustomerCreditResponse> {
  constructor(
    @inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository
  ) { }

  async execute(request: AdjustCustomerCreditRequest): Promise<AdjustCustomerCreditResponse> {
    const { customerId, amount, description } = request;
    const tenantId = getTenantId()!;

    const customer = await this.customerRepo.findById(customerId);
    if (!customer) {
      throw new Error("Cliente não encontrado.");
    }

    // O Use Case agora foca apenas na consistência do saldo
    if (amount < 0 && customer.creditBalance + amount < 0) {
      throw new Error("Saldo insuficiente de créditos.");
    }

    await this.customerRepo.updateCreditBalance(customerId, amount);

    // Publish event - O Ledger será registrado por um handler
    domainEvents.publish(DOMAIN_EVENTS.CUSTOMER_CREDIT_ADJUSTED, {
      customerId,
      tenantId,
      amount,
      newBalance: customer.creditBalance + amount,
      description,
      source: "MANUAL"
    }).catch(err => console.error("Error publishing CUSTOMER_CREDIT_ADJUSTED:", err));

    return {
      success: true,
      newBalance: customer.creditBalance + amount
    };
  }
}
