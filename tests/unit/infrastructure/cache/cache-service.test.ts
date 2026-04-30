import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryCacheService } from "@/lib/infrastructure/cache/cache-service";

describe("MemoryCacheService", () => {
  let cache: MemoryCacheService;

  beforeEach(() => {
    cache = new MemoryCacheService();
    vi.useRealTimers();
  });

  it("round-trips arbitrary JSON values", async () => {
    await cache.set("key", { foo: 1 });
    expect(await cache.get<{ foo: number }>("key")).toEqual({ foo: 1 });
  });

  it("expires entries after their TTL", async () => {
    vi.useFakeTimers();
    await cache.set("k", "v", 5);
    expect(await cache.has("k")).toBe(true);

    vi.advanceTimersByTime(5_001);
    expect(await cache.get("k")).toBeNull();
    expect(await cache.has("k")).toBe(false);
  });

  it("setIfAbsent only writes when the key is missing", async () => {
    expect(await cache.setIfAbsent("k", "first", 60)).toBe(true);
    expect(await cache.setIfAbsent("k", "second", 60)).toBe(false);
    expect(await cache.get("k")).toBe("first");
  });

  it("delete removes the value", async () => {
    await cache.set("k", "v");
    await cache.delete("k");
    expect(await cache.has("k")).toBe(false);
  });

  it("clear wipes everything", async () => {
    await cache.set("a", 1);
    await cache.set("b", 2);
    await cache.clear();
    expect(await cache.get("a")).toBeNull();
    expect(await cache.get("b")).toBeNull();
  });

  it("increment behaves like Redis: only the first INCR sets the TTL", async () => {
    vi.useFakeTimers();

    expect(await cache.increment("counter", 60)).toBe(1);
    vi.advanceTimersByTime(30_000);
    expect(await cache.increment("counter", 60)).toBe(2);

    // 31s after the first increment — still inside the original 60s window.
    vi.advanceTimersByTime(31_000);
    expect(await cache.get("counter")).toBeNull();
  });

  it("increment without TTL keeps the value indefinitely", async () => {
    vi.useFakeTimers();
    await cache.increment("c");
    vi.advanceTimersByTime(1_000_000);
    expect(await cache.get<number>("c")).toBe(1);
  });
});
