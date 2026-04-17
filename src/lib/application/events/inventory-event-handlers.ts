import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import { logger } from "@/lib/logger";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { OrderPlacedPayload } from "@/lib/domain/events/event-payloads";
import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";

/**
 * Decrements stock for products or inventory items when an order is placed.
 */
export async function decrementStockOnOrderPlaced(data: OrderPlacedPayload) {
  const inventoryRepo = container.resolve<IInventoryRepository>(TOKENS.InventoryRepository);
  const productRepo = container.resolve<IProductRepository>(TOKENS.ProductRepository);

  logger.info(`Handler [DecrementStockOnOrderPlaced]: Processing ${data.items.length} items for order ${data.orderId}`);

  const inventoryIds: string[] = [];

  for (const item of data.items) {
    try {
      if (item.inventoryId) {
        await inventoryRepo.decrementStock(item.inventoryId, item.quantity);
        inventoryIds.push(item.inventoryId);
      } else if (item.productId) {
        await productRepo.decrementStock(item.productId, item.quantity);
        // We might also want to invalidate product cache if it exists, 
        // but for now focus on singles (inventory)
      }
    } catch (err) {
      logger.error(`Error decrementing stock for item in order ${data.orderId}`, err as Error);
      // In a real system, we might trigger a compensating action or a notification
    }
  }

  // Publish INVENTORY_UPDATED to trigger cache invalidation
  if (inventoryIds.length > 0) {
    domainEvents.publish(DOMAIN_EVENTS.INVENTORY_UPDATED, {
      tenantId: data.tenantId,
      inventoryIds,
      source: "order_placed_handler"
    }).catch(err => logger.error("Error publishing INVENTORY_UPDATED from order handler:", err));
  }
}
