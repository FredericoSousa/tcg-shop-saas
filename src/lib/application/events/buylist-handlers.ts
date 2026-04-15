import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import { logger } from "@/lib/logger";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import type { ICustomerCreditLedgerRepository } from "@/lib/domain/repositories/customer-credit-ledger.repository";

interface BuylistProposalApprovedData {
  proposalId: string;
  paymentMethod: 'CASH' | 'STORE_CREDIT';
  tenantId: string;
  customerId: string;
  amount: number;
  items: {
    cardTemplateId: string;
    condition: string;
    language: string;
    quantity: number;
    priceCash: number;
  }[];
}

/**
 * Updates inventory stock level when a buylist proposal is approved.
 */
export async function updateInventoryOnBuylistApproval(data: BuylistProposalApprovedData) {
  const inventoryRepository = container.resolve<IInventoryRepository>(TOKENS.InventoryRepository);
  
  if (!data.items || data.items.length === 0) return;

  logger.info(`Handler [UpdateInventoryOnBuylistApproval]: Processing ${data.items.length} items for proposal ${data.proposalId}`);

  for (const item of data.items) {
    try {
      const existingItems = await inventoryRepository.findAllActive(data.tenantId);
      const matches = existingItems.find(i => 
        i.cardTemplateId === item.cardTemplateId && 
        i.condition === item.condition && 
        i.language === item.language
      );

      if (matches) {
        await inventoryRepository.update(matches.id, { quantity: matches.quantity + item.quantity });
      } else {
        await inventoryRepository.save({
          id: "",
          tenantId: data.tenantId,
          cardTemplateId: item.cardTemplateId,
          price: Number(item.priceCash) * 1.5,
          quantity: item.quantity,
          condition: item.condition,
          language: item.language,
          active: true,
          allowNegativeStock: false,
          extras: [],
        });
      }
    } catch (error) {
      logger.error(`Error updating inventory for item ${item.cardTemplateId} in proposal ${data.proposalId}`, error as Error);
    }
  }
}

/**
 * Grants store credit to the customer if the payment method is STORE_CREDIT.
 */
export async function grantCreditOnBuylistApproval(data: BuylistProposalApprovedData) {
  if (data.paymentMethod !== 'STORE_CREDIT') return;

  const customerRepository = container.resolve<ICustomerRepository>(TOKENS.CustomerRepository);
  const creditLedgerRepository = container.resolve<ICustomerCreditLedgerRepository>(TOKENS.CustomerCreditLedgerRepository);

  logger.info(`Handler [GrantCreditOnBuylistApproval]: Granting ${data.amount} credits to customer ${data.customerId}`);

  try {
    const customer = await customerRepository.findById(data.customerId);
    if (!customer) {
      logger.error(`Customer ${data.customerId} not found for credit grant in proposal ${data.proposalId}`);
      return;
    }

    const newBalance = Number(customer.creditBalance) + data.amount;
    await customerRepository.update(customer.id, { creditBalance: newBalance });

    await creditLedgerRepository.save({
      tenantId: data.tenantId,
      customerId: data.customerId,
      orderId: null,
      amount: data.amount,
      type: 'CREDIT',
      source: 'BUYLIST_PROPOSAL',
      description: `Crédito referente à Proposta de Buylist #${data.proposalId.slice(0, 8)}`,
    });
  } catch (error) {
    logger.error(`Error granting credit for proposal ${data.proposalId}`, error as Error);
  }
}
