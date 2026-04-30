import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit } from "@/lib/rate-limiter";
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";

const cache = {
  get: vi.fn(),
  set: vi.fn(),
  setIfAbsent: vi.fn(),
  has: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  increment: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(container, "resolve").mockImplementation((token: unknown) => {
    if (token === TOKENS.CacheService) return cache;
    return {} as never;
  });
});

describe("checkRateLimit", () => {
  it("allows the request and reports remaining capacity when below the limit", async () => {
    cache.increment.mockResolvedValue(1);
    const result = await checkRateLimit("ip:1.2.3.4", { limit: 10, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
    expect(cache.increment).toHaveBeenCalledWith("ratelimit:ip:1.2.3.4", 60);
  });

  it("denies the request once the counter exceeds the limit", async () => {
    cache.increment.mockResolvedValue(11);
    const result = await checkRateLimit("ip:1.2.3.4", { limit: 10, windowSeconds: 60 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("returns a resetAt timestamp roughly windowSeconds in the future", async () => {
    cache.increment.mockResolvedValue(1);
    const before = Date.now();
    const result = await checkRateLimit("k", { limit: 5, windowSeconds: 30 });
    expect(result.resetAt).toBeGreaterThanOrEqual(before + 29_900);
    expect(result.resetAt).toBeLessThanOrEqual(before + 30_500);
  });
});
