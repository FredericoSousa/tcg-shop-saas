import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import type { ICustomerCreditLedgerRepository } from "@/lib/domain/repositories/customer-credit-ledger.repository";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "../../tenant-context";
import { IUseCase } from "./use-case.interface";

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
    @inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository,
    @inject(TOKENS.CustomerCreditLedgerRepository) private ledgerRepo: ICustomerCreditLedgerRepository
  ) {}

  async execute(request: AdjustCustomerCreditRequest): Promise<AdjustCustomerCreditResponse> {
    const { customerId, amount, description } = request;
    const tenantId = getTenantId()!;

    const customer = await this.customerRepo.findById(customerId);
    if (!customer) {
      throw new Error("Cliente não encontrado.");
    }

    // Check if debit is possible
    if (amount < 0 && customer.creditBalance + amount < 0) {
      throw new Error("Saldo insuficiente de créditos.");
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update customer balance
      await this.customerRepo.updateCreditBalance(customerId, amount, tx);

      // 2. Add ledger entry
      await this.ledgerRepo.save({
        tenantId,
        customerId,
        orderId: null,
        amount: Math.abs(amount),
        type: amount > 0 ? "CREDIT" : "DEBIT",
        source: "MANUAL",
        description,
      }, tx);
    });

    const updatedCustomer = await this.customerRepo.findById(customerId);

    return { 
      success: true, 
      newBalance: updatedCustomer?.creditBalance || 0 
    };
  }
}
