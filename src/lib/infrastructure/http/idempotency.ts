import type { NextRequest } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import type { ICacheService } from "@/lib/infrastructure/cache/cache-service";
import { logger } from "@/lib/logger";

const IDEMPOTENCY_HEADER = "idempotency-key";
// 24h is the standard window — keeps responses long enough for client
// retries on flaky networks without growing Redis indefinitely.
const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24;

interface StoredResponse {
  status: number;
  body: unknown;
}

/**
 * Read the `Idempotency-Key` header. Returns null when absent.
 *
 * Keys are scoped per route+tenant by the caller so two endpoints don't
 * collide on the same key.
 */
export function getIdempotencyKey(request: NextRequest): string | null {
  const raw = request.headers.get(IDEMPOTENCY_HEADER);
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.length < 8 || trimmed.length > 200) return null;
  return trimmed;
}

/**
 * Replays a previously cached response for an idempotency key, or runs
 * `handler` and stores its result. The first caller wins via a SET-NX
 * lock; concurrent retries with the same key get a 409 telling them
 * the original is still in-flight, so we never double-execute.
 */
export async function withIdempotency<T>(
  scope: string,
  key: string,
  handler: () => Promise<{ status: number; body: T }>,
): Promise<{ status: number; body: T }> {
  const cache = container.resolve<ICacheService>(TOKENS.CacheService);
  const cacheKey = `idempotency:${scope}:${key}`;
  const lockKey = `${cacheKey}:lock`;

  const cached = await cache.get<StoredResponse>(cacheKey);
  if (cached) {
    logger.info(`Idempotency hit for ${cacheKey}`);
    return { status: cached.status, body: cached.body as T };
  }

  // 30s lock window — long enough for the slowest checkout to finish
  // before the next retry is allowed.
  const acquired = await cache.setIfAbsent(lockKey, "1", 30);
  if (!acquired) {
    return {
      status: 409,
      body: {
        success: false,
        message: "Operação já em andamento com a mesma chave de idempotência.",
        error: { code: "IDEMPOTENCY_IN_FLIGHT" },
      } as unknown as T,
    };
  }

  try {
    const result = await handler();
    if (result.status >= 200 && result.status < 300) {
      await cache.set<StoredResponse>(
        cacheKey,
        { status: result.status, body: result.body },
        IDEMPOTENCY_TTL_SECONDS,
      );
    }
    return result;
  } finally {
    await cache.delete(lockKey);
  }
}
