import { describe, it, expect, beforeEach, vi } from "vitest";
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import {
  checkLoginGate,
  clearLoginFailures,
  recordLoginFailure,
  LOGIN_THROTTLE,
} from "@/lib/auth/login-throttle";
import type { ICacheService } from "@/lib/infrastructure/cache/cache-service";

function memoryCache(): ICacheService {
  const store = new Map<string, { value: unknown; expiresAt: number | null }>();
  return {
    async get<T>(key: string): Promise<T | null> {
      const e = store.get(key);
      if (!e) return null;
      if (e.expiresAt && e.expiresAt < Date.now()) {
        store.delete(key);
        return null;
      }
      return e.value as T;
    },
    async set(key, value, ttl) {
      store.set(key, {
        value,
        expiresAt: ttl ? Date.now() + ttl * 1000 : null,
      });
    },
    async setIfAbsent(key, value, ttl) {
      if (store.has(key)) return false;
      await this.set(key, value, ttl);
      return true;
    },
    async has(key) {
      return (await this.get(key)) !== null;
    },
    async delete(key) {
      store.delete(key);
    },
    async clear() {
      store.clear();
    },
    async increment(key, ttl) {
      const cur = ((await this.get<number>(key)) ?? 0) + 1;
      await this.set(key, cur, ttl);
      return cur;
    },
  };
}

describe("login-throttle", () => {
  beforeEach(() => {
    const cache = memoryCache();
    vi.spyOn(container, "resolve").mockImplementation((token: unknown) => {
      if (token === TOKENS.CacheService) return cache;
      return {} as never;
    });
  });

  it("returns unlocked when no failures recorded", async () => {
    const gate = await checkLoginGate("t1", "user@example.com");
    expect(gate.locked).toBe(false);
    expect(gate.failures).toBe(0);
  });

  it("locks the account after the failure threshold is reached", async () => {
    for (let i = 0; i < LOGIN_THROTTLE.failureThreshold - 1; i += 1) {
      const r = await recordLoginFailure("t1", "user@example.com");
      expect(r.locked).toBe(false);
    }
    const final = await recordLoginFailure("t1", "user@example.com");
    expect(final.locked).toBe(true);
    expect(final.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("clearLoginFailures removes both counter and lockout", async () => {
    for (let i = 0; i < LOGIN_THROTTLE.failureThreshold; i += 1) {
      await recordLoginFailure("t1", "user@example.com");
    }
    await clearLoginFailures("t1", "user@example.com");
    const gate = await checkLoginGate("t1", "user@example.com");
    expect(gate.locked).toBe(false);
    expect(gate.failures).toBe(0);
  });

  it("treats email casing as equivalent — caser@x and CASER@X share a bucket", async () => {
    for (let i = 0; i < LOGIN_THROTTLE.failureThreshold; i += 1) {
      await recordLoginFailure("t1", "User@Example.com");
    }
    const gate = await checkLoginGate("t1", "user@example.com");
    expect(gate.locked).toBe(true);
  });
});
