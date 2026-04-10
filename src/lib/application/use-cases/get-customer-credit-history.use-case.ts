import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { ICustomerCreditLedgerRepository } from "@/lib/domain/repositories/customer-credit-ledger.repository";
import { CustomerCreditLedger } from "@/lib/domain/entities/customer-credit-ledger";
import { IUseCase } from "./use-case.interface";

export interface GetCustomerCreditHistoryRequest {
  customerId: string;
}

export type GetCustomerCreditHistoryResponse = CustomerCreditLedger[];

@injectable()
export class GetCustomerCreditHistoryUseCase implements IUseCase<GetCustomerCreditHistoryRequest, GetCustomerCreditHistoryResponse> {
  constructor(
    @inject(TOKENS.CustomerCreditLedgerRepository) private ledgerRepo: ICustomerCreditLedgerRepository
  ) {}

  async execute(request: GetCustomerCreditHistoryRequest): Promise<GetCustomerCreditHistoryResponse> {
    return this.ledgerRepo.findByCustomerId(request.customerId);
  }
}
