import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import type { IOutboxRepository } from "@/lib/domain/repositories/outbox.repository";
import { domainEvents } from "@/lib/domain/events/domain-events";
import { logger } from "@/lib/logger";

const DEFAULT_BATCH_SIZE = 50;
const MAX_ATTEMPTS = 10;

export interface DrainResult {
  picked: number;
  processed: number;
  failed: number;
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
  const outbox = container.resolve<IOutboxRepository>(TOKENS.OutboxRepository);
  const events = await outbox.pickPending(batchSize);

  let processed = 0;
  let failed = 0;

  for (const event of events) {
    if (event.attempts >= MAX_ATTEMPTS) {
      logger.error(
        `Outbox event ${event.id} (${event.eventName}) exceeded ${MAX_ATTEMPTS} attempts — leaving for manual inspection`,
      );
      continue;
    }

    try {
      await domainEvents.publish(event.eventName, event.payload);
      await outbox.markProcessed(event.id);
      processed += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(
        `Outbox event ${event.id} (${event.eventName}) failed: ${message}`,
      );
      await outbox.recordFailure(event.id, message);
      failed += 1;
    }
  }

  return { picked: events.length, processed, failed };
}
