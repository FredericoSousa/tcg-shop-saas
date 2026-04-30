import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";
import { logger } from "@/lib/logger";
import { CustomerCreditAdjustedPayload } from "@/lib/domain/events/event-payloads";
import { notifyBuylistApproval } from "./buylist-handlers";
import { recordLedgerOnCreditAdjustment } from "./customer-credit-handlers";
import { invalidateInventoryCacheOnOrderPlaced } from "./inventory-event-handlers";
import { handleInventoryCacheInvalidation } from "./cache-handlers";

/**
 * Register all domain event handlers.
 *
 * Handlers run after the originating transaction commits — keep them
 * idempotent and treat them as best-effort. State that must be consistent
 * (stock decrement, ledger writes during checkout) belongs *inside* the
 * use-case transaction, not here.
 */
export function registerEventHandlers() {
  logger.info("Registering Domain Event Handlers...");

  domainEvents.subscribe(DOMAIN_EVENTS.BUYLIST_PROPOSAL_APPROVED, notifyBuylistApproval);

  domainEvents.subscribe(DOMAIN_EVENTS.BUYLIST_PROPOSAL_REJECTED, (data) => {
    logger.info("Handler [BuylistProposalRejected]: Proposal cancelled", { data });
  });

  domainEvents.subscribe<CustomerCreditAdjustedPayload>(
    DOMAIN_EVENTS.CUSTOMER_CREDIT_ADJUSTED,
    recordLedgerOnCreditAdjustment,
  );

  domainEvents.subscribe(DOMAIN_EVENTS.ORDER_PLACED, invalidateInventoryCacheOnOrderPlaced);
  domainEvents.subscribe(DOMAIN_EVENTS.INVENTORY_UPDATED, handleInventoryCacheInvalidation);
  domainEvents.subscribe(DOMAIN_EVENTS.INVENTORY_DELETED, handleInventoryCacheInvalidation);
}
