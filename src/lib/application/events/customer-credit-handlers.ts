import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import { logger } from "@/lib/logger";
import type { ICustomerCreditLedgerRepository } from "@/lib/domain/repositories/customer-credit-ledger.repository";
import { CustomerCreditAdjustedPayload } from "@/lib/domain/events/event-payloads";

/**
 * Records a ledger entry when credit is manually adjusted.
 *
 * Order-payment ledger entries are written transactionally inside
 * FinalizeOrderUseCase — see that use-case for the credit-on-checkout path.
 */
export async function recordLedgerOnCreditAdjustment(data: CustomerCreditAdjustedPayload) {
  const ledgerRepo = container.resolve<ICustomerCreditLedgerRepository>(TOKENS.CustomerCreditLedgerRepository);

  logger.info(`Handler [RecordLedgerOnCreditAdjustment]: Recording ${data.amount > 0 ? 'CREDIT' : 'DEBIT'} for customer ${data.customerId}`);

  await ledgerRepo.save({
    tenantId: data.tenantId,
    customerId: data.customerId,
    orderId: data.orderId || null,
    amount: Math.abs(data.amount),
    type: data.amount > 0 ? "CREDIT" : "DEBIT",
    source: data.source || "MANUAL",
    description: data.description,
  });
}
