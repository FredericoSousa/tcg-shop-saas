import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import type { IOutboxRepository } from "@/lib/domain/repositories/outbox.repository";
import { domainEvents } from "@/lib/domain/events/domain-events";
import { logger } from "@/lib/logger";
import { withRLSBypass } from "@/lib/prisma";
import { withSpan } from "@/lib/observability/tracer";

const DEFAULT_BATCH_SIZE = 50;
const MAX_ATTEMPTS = 10;

export interface DrainResult {
  picked: number;
  processed: number;
  failed: number;
  deadLettered: number;
}

/**
 * Drain a batch of pending outbox events: dispatch each via the
 * in-process bus and stamp `processed_at` on success. Failures are
 * recorded with an attempt counter; events past `MAX_ATTEMPTS` are
 * left in the table for ops to inspect — we don't quietly drop them.
 *
 * Intended to be invoked from a cron-style schedule (Vercel cron,
 * external scheduler, …) every N seconds. Idempotent — safe to run
 * multiple instances; concurrent workers will just race on UPDATE
 * and one will win per row.
 */
export async function drainOutbox(
  batchSize: number = DEFAULT_BATCH_SIZE,
): Promise<DrainResult> {
  // The worker is cross-tenant by design: it reads every pending event
  // and routes them to handlers (which then act within their own tenant
  // scope). Without bypass, RLS would hide every row.
  return withSpan("outbox.drain", { "outbox.batch_size": batchSize }, () =>
    withRLSBypass(async () => {
    const outbox = container.resolve<IOutboxRepository>(TOKENS.OutboxRepository);
    const events = await outbox.pickPending(batchSize);

    let processed = 0;
    let failed = 0;
    let deadLettered = 0;

    for (const event of events) {
      try {
        await domainEvents.publish(event.eventName, event.payload);
        await outbox.markProcessed(event.id);
        processed += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // event.attempts reflects the count *before* this run; the next
        // attempt is therefore attempts+1, so we DLQ when that lands at
        // or beyond the cap.
        const willExhaust = event.attempts + 1 >= MAX_ATTEMPTS;
        if (willExhaust) {
          await outbox.recordFailure(event.id, message);
          await outbox.markDeadLettered(event.id);
          deadLettered += 1;
          logger.error(
            `Outbox event ${event.id} (${event.eventName}) dead-lettered after ${MAX_ATTEMPTS} attempts: ${message}`,
            new Error(message),
            { tenantId: event.tenantId ?? undefined, eventName: event.eventName, risk: "outbox_dlq" },
          );
        } else {
          await outbox.recordFailure(event.id, message);
          failed += 1;
          logger.warn(
            `Outbox event ${event.id} (${event.eventName}) failed (attempt ${event.attempts + 1}/${MAX_ATTEMPTS}): ${message}`,
          );
        }
      }
    }

    return { picked: events.length, processed, failed, deadLettered };
    }),
  );
}
