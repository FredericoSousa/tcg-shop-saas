import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  getIdempotencyKey,
  withIdempotency,
} from "@/lib/infrastructure/http/idempotency";
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import { MemoryCacheService } from "@/lib/infrastructure/cache/cache-service";

function reqWithKey(key?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (key !== undefined) headers["idempotency-key"] = key;
  return new NextRequest("http://example.com/x", { method: "POST", headers });
}

describe("getIdempotencyKey", () => {
  it("returns the trimmed key when present and within bounds", () => {
    expect(getIdempotencyKey(reqWithKey("  abc12345-key  "))).toBe("abc12345-key");
  });

  it("rejects keys shorter than 8 chars", () => {
    expect(getIdempotencyKey(reqWithKey("short"))).toBeNull();
  });

  it("rejects keys longer than 200 chars", () => {
    expect(getIdempotencyKey(reqWithKey("x".repeat(201)))).toBeNull();
  });

  it("returns null when the header is absent", () => {
    expect(getIdempotencyKey(reqWithKey())).toBeNull();
  });
});

describe("withIdempotency", () => {
  let cache: MemoryCacheService;

  beforeEach(() => {
    cache = new MemoryCacheService();
    vi.spyOn(container, "resolve").mockImplementation((token: unknown) => {
      if (token === TOKENS.CacheService) return cache;
      return {} as never;
    });
  });

  it("runs the handler once and replays the cached response on retry", async () => {
    const handler = vi.fn().mockResolvedValue({
      status: 200,
      body: { ok: true, n: 1 },
    });

    const first = await withIdempotency("checkout:t1", "key-aaaaaaaa", handler);
    const second = await withIdempotency("checkout:t1", "key-aaaaaaaa", handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(first.status).toBe(200);
  });

  it("does not cache non-2xx responses", async () => {
    const handler = vi
      .fn()
      .mockResolvedValueOnce({ status: 500, body: { ok: false } })
      .mockResolvedValueOnce({ status: 200, body: { ok: true } });

    await withIdempotency("scope", "key-12345678", handler);
    const second = await withIdempotency("scope", "key-12345678", handler);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(second.status).toBe(200);
  });

  it("rejects a concurrent retry with the same key while the original is in-flight", async () => {
    let release!: () => void;
    const inFlight = new Promise<void>((r) => { release = r; });

    const handler = vi.fn().mockImplementation(async () => {
      await inFlight;
      return { status: 200, body: { ok: true } };
    });

    const first = withIdempotency("scope", "key-inflight-x", handler);
    const concurrent = await withIdempotency("scope", "key-inflight-x", handler);

    expect(concurrent.status).toBe(409);
    expect((concurrent.body as { error: { code: string } }).error.code).toBe(
      "IDEMPOTENCY_IN_FLIGHT",
    );

    release();
    await first;
  });
});
