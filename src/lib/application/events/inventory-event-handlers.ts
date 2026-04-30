import { logger } from "@/lib/logger";
import { OrderPlacedPayload } from "@/lib/domain/events/event-payloads";
import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";

/**
 * Triggers cache invalidation after an order is placed.
 *
 * Stock decrement is performed atomically inside the order-placement
 * transaction (see PlaceOrderUseCase / POSCheckoutUseCase) — this handler
 * only fans out a downstream event so caches/storefront listings refresh.
 */
export async function invalidateInventoryCacheOnOrderPlaced(data: OrderPlacedPayload) {
  const inventoryIds = data.items
    .map(item => item.inventoryId)
    .filter((id): id is string => Boolean(id));

  if (inventoryIds.length === 0) return;

  logger.info(`Handler [InvalidateInventoryCacheOnOrderPlaced]: ${inventoryIds.length} items for order ${data.orderId}`);

  domainEvents.publish(DOMAIN_EVENTS.INVENTORY_UPDATED, {
    tenantId: data.tenantId,
    inventoryIds,
    source: "order_placed_handler",
  }).catch(err => logger.error("Error publishing INVENTORY_UPDATED from order handler:", err));
}
