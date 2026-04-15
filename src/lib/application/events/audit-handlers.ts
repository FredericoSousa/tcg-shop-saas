import { logger } from "@/lib/logger";

interface BaseEventPayload {
  tenantId?: string;
  userId?: string;
  productId?: string;
  customerId?: string;
  orderId?: string;
  proposalId?: string;
  inventoryId?: string;
  id?: string;
}

/**
 * A central handler to record an audit trail of important domain events.
 * In a production system, this would write to a dedicated AuditLogs table.
 */
export function auditLogHandler(eventName: string, data: unknown) {
  const timestamp = new Date().toISOString();
  const payload = data as BaseEventPayload;

  // Basic structured log for auditing
  logger.info(`[AUDIT] ${timestamp} - Event: ${eventName}`, {
    tenantId: payload.tenantId,
    actorId: payload.userId || 'system',
    resourceId: payload.productId || payload.customerId || payload.orderId || payload.proposalId || payload.inventoryId || payload.id,
    metadata: data
  });
}
