import { revalidateTag } from "next/cache";
import { logger } from "@/lib/logger";
import { InventoryUpdatedPayload, InventoryDeletedPayload } from "@/lib/domain/events/event-payloads";

/**
 * Handles cache invalidation for storefront inventory when inventory is updated.
 */
export async function handleInventoryCacheInvalidation(data: InventoryUpdatedPayload | InventoryDeletedPayload) {
  const { tenantId } = data;
  
  if (!tenantId) {
    logger.warn("Cache Invalidation [Inventory]: Missing tenantId in event payload");
    return;
  }

  const tag = `tenant-${tenantId}-inventory`;
  
  logger.info(`Cache Invalidation [Inventory]: Revalidating tag "${tag}"`, { 
    source: (data as InventoryUpdatedPayload).source || 'deleted' 
  });

  try {
    // In Next.js 16.2.1, revalidateTag requires a profile/config argument
    revalidateTag(tag, 'default');
  } catch (err) {
    // revalidateTag can throw if called outside of a request context where it's supported
    // but in Next.js 15+ it usually works in Server Actions and API routes.
    logger.error(`Error revalidating tag "${tag}":`, err as Error);
  }
}
