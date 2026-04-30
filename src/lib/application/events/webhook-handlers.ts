import { createHmac } from "node:crypto";
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import type { ITenantRepository } from "@/lib/domain/repositories/tenant.repository";
import { logger } from "@/lib/logger";
import { CircuitBreaker, retryWithBackoff } from "@/lib/resilience/circuit-breaker";
import { withSpan } from "@/lib/observability/tracer";
import { withRLSBypass } from "@/lib/prisma";

interface WebhookPayload {
  eventName: string;
  tenantId: string;
  data: unknown;
}

const breakers = new Map<string, CircuitBreaker>();

function getBreaker(tenantId: string): CircuitBreaker {
  let b = breakers.get(tenantId);
  if (!b) {
    // Per-tenant breaker so a single tenant's broken endpoint doesn't
    // pause delivery for everyone else.
    b = new CircuitBreaker({
      name: `webhook:${tenantId}`,
      failureThreshold: 5,
      windowMs: 60_000,
      cooldownMs: 60_000,
    });
    breakers.set(tenantId, b);
  }
  return b;
}

export function signPayload(secret: string, body: string, timestamp: number): string {
  // Same scheme as Stripe/GitHub: timestamp.body keyed by the secret.
  // Verifier reconstructs the prefix to defeat replay across clock
  // skews and to make signature reuse for a different body fail.
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

/**
 * Best-effort outbound webhook delivery for a domain event. Looks up
 * the tenant's `webhookUrl` and `webhookSecret`; signs the JSON body
 * with HMAC-SHA256; POSTs with retry + circuit breaker.
 *
 * Errors propagate so the outbox worker counts the attempt and
 * eventually dead-letters. Tenants without webhooks configured are a
 * no-op — never an error.
 */
export async function deliverWebhook(payload: WebhookPayload): Promise<void> {
  const tenantRepo = container.resolve<ITenantRepository>(TOKENS.TenantRepository);
  // The handler executes inside the outbox worker which already runs
  // under RLS bypass — but defensive scoping costs nothing if a future
  // caller invokes the handler outside that context.
  const tenant = await withRLSBypass(() => tenantRepo.findById(payload.tenantId));
  if (!tenant?.webhookUrl || !tenant.webhookSecret) {
    logger.debug("Tenant has no webhook configured — skipping", {
      tenantId: payload.tenantId,
      eventName: payload.eventName,
    });
    return;
  }

  const url = tenant.webhookUrl;
  const secret = tenant.webhookSecret;
  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({
    eventName: payload.eventName,
    tenantId: payload.tenantId,
    timestamp,
    data: payload.data,
  });
  const signature = signPayload(secret, body, timestamp);

  await withSpan(
    "webhook.deliver",
    {
      "tenant.id": payload.tenantId,
      "webhook.event": payload.eventName,
      "webhook.url": url,
    },
    () =>
      getBreaker(payload.tenantId).exec(() =>
        retryWithBackoff(
          async () => {
            const res = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Webhook-Event": payload.eventName,
                "X-Webhook-Timestamp": String(timestamp),
                "X-Webhook-Signature": `sha256=${signature}`,
              },
              body,
              // Don't dangle: tenant endpoints sometimes hang.
              signal: AbortSignal.timeout(10_000),
            });
            if (!res.ok) {
              throw new Error(
                `webhook ${url} returned ${res.status}`,
              );
            }
          },
          { attempts: 3, baseMs: 500, maxMs: 5_000 },
        ),
      ),
  );
}

/** Test seam: clear breaker registry between unit tests. */
export function __resetWebhookBreakersForTests(): void {
  breakers.clear();
}
