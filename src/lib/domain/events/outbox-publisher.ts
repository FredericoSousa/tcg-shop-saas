import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import type { IOutboxRepository } from "@/lib/domain/repositories/outbox.repository";

/**
 * Enqueue a domain event for at-least-once delivery.
 *
 * Must be called *inside* the same Prisma transaction as the state
 * change (`tx`); otherwise the safety guarantee — that the event is
 * only persisted when the business mutation commits — is lost.
 *
 * The transactional outbox worker (`outbox-worker.ts`) drains pending
 * rows, dispatches them through the in-process `domainEvents` bus and
 * stamps `processed_at` on success.
 */
export async function enqueueDomainEvent(
  eventName: string,
  payload: unknown,
  tenantId: string | null,
  tx: unknown,
): Promise<void> {
  const outbox = container.resolve<IOutboxRepository>(TOKENS.OutboxRepository);
  await outbox.enqueue(eventName, payload, tenantId, tx);
}
