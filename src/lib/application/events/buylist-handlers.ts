import { logger } from "@/lib/logger";

interface BuylistProposalApprovedData {
  proposalId: string;
  paymentMethod: 'CASH' | 'STORE_CREDIT';
  tenantId: string;
  customerId: string;
  amount: number;
}

/**
 * Notification-only handler for buylist approvals.
 *
 * Inventory upsert, credit grant and ledger writes are performed
 * atomically inside ProcessBuylistProposalUseCase. This handler exists
 * so downstream consumers (e-mail, push, audit, analytics) can react
 * after the transaction commits.
 */
export async function notifyBuylistApproval(data: BuylistProposalApprovedData) {
  logger.info(
    `Handler [NotifyBuylistApproval]: proposal ${data.proposalId} approved (${data.paymentMethod}) for customer ${data.customerId} amount=${data.amount}`,
  );
}
