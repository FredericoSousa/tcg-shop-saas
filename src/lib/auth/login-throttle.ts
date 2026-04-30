import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import type { ICacheService } from "@/lib/infrastructure/cache/cache-service";

const FAILURE_WINDOW_SECONDS = 15 * 60;
const FAILURE_THRESHOLD = 5;
const LOCKOUT_SECONDS = 15 * 60;

export interface LoginGate {
  /** True when the caller is currently locked out and must wait. */
  locked: boolean;
  /** Seconds left until the lock expires (0 when not locked). */
  retryAfterSeconds: number;
  /** Failed attempts counted in the current window. */
  failures: number;
}

function failureKey(tenantId: string, email: string): string {
  return `auth_failures:${tenantId}:${email.toLowerCase()}`;
}

function lockoutKey(tenantId: string, email: string): string {
  return `auth_lockout:${tenantId}:${email.toLowerCase()}`;
}

/**
 * Per-account brute-force gate. Independent from the per-IP proxy
 * limiter — an attacker rotating IPs would slip past the IP bucket but
 * still hits this one because it keys on the account.
 *
 * After FAILURE_THRESHOLD failures within FAILURE_WINDOW_SECONDS the
 * account is hard-locked for LOCKOUT_SECONDS regardless of subsequent
 * attempts. Successful login resets the counter.
 */
export async function checkLoginGate(
  tenantId: string,
  email: string,
): Promise<LoginGate> {
  const cache = container.resolve<ICacheService>(TOKENS.CacheService);
  const lock = await cache.get<number>(lockoutKey(tenantId, email));
  if (lock != null) {
    const remaining = Math.max(0, lock - Math.floor(Date.now() / 1000));
    if (remaining > 0) {
      return { locked: true, retryAfterSeconds: remaining, failures: FAILURE_THRESHOLD };
    }
  }
  const failures = (await cache.get<number>(failureKey(tenantId, email))) ?? 0;
  return { locked: false, retryAfterSeconds: 0, failures };
}

export async function recordLoginFailure(
  tenantId: string,
  email: string,
): Promise<LoginGate> {
  const cache = container.resolve<ICacheService>(TOKENS.CacheService);
  const failures = await cache.increment(
    failureKey(tenantId, email),
    FAILURE_WINDOW_SECONDS,
  );

  if (failures >= FAILURE_THRESHOLD) {
    const expiresAtSec = Math.floor(Date.now() / 1000) + LOCKOUT_SECONDS;
    await cache.set(lockoutKey(tenantId, email), expiresAtSec, LOCKOUT_SECONDS);
    return { locked: true, retryAfterSeconds: LOCKOUT_SECONDS, failures };
  }

  return { locked: false, retryAfterSeconds: 0, failures };
}

export async function clearLoginFailures(
  tenantId: string,
  email: string,
): Promise<void> {
  const cache = container.resolve<ICacheService>(TOKENS.CacheService);
  await cache.delete(failureKey(tenantId, email));
  await cache.delete(lockoutKey(tenantId, email));
}

export const LOGIN_THROTTLE = {
  failureWindowSeconds: FAILURE_WINDOW_SECONDS,
  failureThreshold: FAILURE_THRESHOLD,
  lockoutSeconds: LOCKOUT_SECONDS,
} as const;
