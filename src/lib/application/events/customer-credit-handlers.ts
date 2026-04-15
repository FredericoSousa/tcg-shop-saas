import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import { logger } from "@/lib/logger";
import type { ICustomerCreditLedgerRepository } from "@/lib/domain/repositories/customer-credit-ledger.repository";
import { CustomerCreditAdjustedPayload, OrderPaidPayload } from "@/lib/domain/events/event-payloads";

/**
 * Records a ledger entry when credit is manually adjusted
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

/**
 * Records a ledger entry when an order is paid using store credit
 */
export async function recordLedgerOnOrderPayment(data: OrderPaidPayload) {
  const creditPayment = data.payments.find((p) => p.method === "STORE_CREDIT");
  if (!creditPayment) return;

  const ledgerRepo = container.resolve<ICustomerCreditLedgerRepository>(TOKENS.CustomerCreditLedgerRepository);
  
  logger.info(`Handler [RecordLedgerOnOrderPayment]: Recording DEBIT for order ${data.orderId}`);

  await ledgerRepo.save({
    tenantId: data.tenantId,
    customerId: data.customerId,
    orderId: data.orderId,
    amount: creditPayment.amount,
    type: "DEBIT",
    source: "ORDER_PAYMENT",
    description: `Pagamento de pedido #${data.orderId.slice(0, 8)}`,
  });
}
