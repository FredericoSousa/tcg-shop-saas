import { logger } from "@/lib/logger";
import { OrderPaidPayload, InventoryUpdatedPayload } from "../../domain/events/event-payloads";

/**
 * Simulates sending notifications to staff or customers.
 */
export async function notificationHandler(eventName: string, data: unknown) {
  switch (eventName) {
    case 'buylist.proposal_submitted': {
      const payload = data as { proposalId: string };
      logger.info(`[NOTIFICATION] To ADMIN: New Buylist Proposal submitted (#${payload.proposalId.slice(0, 8)})`);
      break;
    }
    
    case 'order.paid': {
      const payload = data as OrderPaidPayload;
      logger.info(`[NOTIFICATION] To CUSTOMER: Thank you for your payment! Order #${payload.orderId.slice(0, 8)} is confirmed.`);
      break;
    }
      
    case 'inventory.updated': {
      const payload = data as InventoryUpdatedPayload;
      if (payload.source === 'bulk_import' && payload.cardIds) {
        logger.info(`[NOTIFICATION] To STAFF: Bulk import completed for ${payload.cardIds.length} cards.`);
      }
      break;
    }

    default:
      // No notification for other events
      break;
  }
}
