import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";
import { logger } from "@/lib/logger";
import { 
  updateInventoryOnBuylistApproval, 
  grantCreditOnBuylistApproval 
} from "./buylist-handlers";
import { 
  recordLedgerOnCreditAdjustment, 
  recordLedgerOnOrderPayment 
} from "./customer-credit-handlers";
import { 
  decrementStockOnOrderPlaced 
} from "./inventory-event-handlers";

/**
 * Register all domain event handlers
 */
export function registerEventHandlers() {
  logger.info("Registering Domain Event Handlers...");

  // 1. Buylist Handlers
  domainEvents.subscribe(DOMAIN_EVENTS.BUYLIST_PROPOSAL_APPROVED, async (data: unknown) => {
    logger.info("Handler [BuylistProposalApproved]: Processing side effects", { data });
    
    // Execute multiple handlers for this event
    await Promise.allSettled([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateInventoryOnBuylistApproval(data as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      grantCreditOnBuylistApproval(data as any)
    ]);
  });

  domainEvents.subscribe(DOMAIN_EVENTS.BUYLIST_PROPOSAL_REJECTED, (data) => {
    logger.info("Handler [BuylistProposalRejected]: Proposal cancelled", { data });
  });

  // 2. Customer Credit & Ledger Handlers
  domainEvents.subscribe(DOMAIN_EVENTS.CUSTOMER_CREDIT_ADJUSTED, recordLedgerOnCreditAdjustment);
  domainEvents.subscribe(DOMAIN_EVENTS.ORDER_PAID, recordLedgerOnOrderPayment);

  // 3. Inventory & Product Handlers
  domainEvents.subscribe(DOMAIN_EVENTS.ORDER_PLACED, decrementStockOnOrderPlaced);
}
