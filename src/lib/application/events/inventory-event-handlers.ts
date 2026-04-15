import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import { logger } from "@/lib/logger";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { OrderPlacedPayload } from "@/lib/domain/events/event-payloads";

/**
 * Decrements stock for products or inventory items when an order is placed.
 */
export async function decrementStockOnOrderPlaced(data: OrderPlacedPayload) {
  const inventoryRepo = container.resolve<IInventoryRepository>(TOKENS.InventoryRepository);
  const productRepo = container.resolve<IProductRepository>(TOKENS.ProductRepository);

  logger.info(`Handler [DecrementStockOnOrderPlaced]: Processing ${data.items.length} items for order ${data.orderId}`);

  for (const item of data.items) {
    try {
      if (item.inventoryId) {
        await inventoryRepo.decrementStock(item.inventoryId, item.quantity);
      } else if (item.productId) {
        await productRepo.decrementStock(item.productId, item.quantity);
      }
    } catch (err) {
      logger.error(`Error decrementing stock for item in order ${data.orderId}`, err as Error);
      // In a real system, we might trigger a compensating action or a notification
    }
  }
}
