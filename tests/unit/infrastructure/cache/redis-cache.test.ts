import { describe, it, expect, beforeEach, vi } from "vitest";

const redisInstance = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  flushdb: vi.fn(),
  incr: vi.fn(),
  eval: vi.fn(),
  on: vi.fn(),
};

vi.mock("ioredis", () => ({
  default: function MockRedis() {
    return redisInstance;
  },
}));

import { RedisCacheService } from "@/lib/infrastructure/cache/cache-service";

describe("RedisCacheService", () => {
  let cache: RedisCacheService;

  beforeEach(() => {
    Object.values(redisInstance).forEach(fn => {
      if (typeof fn === "function" && "mockReset" in fn) {
        (fn as ReturnType<typeof vi.fn>).mockReset();
      }
    });
    cache = new RedisCacheService("redis://localhost:6379");
  });

  it("get parses stored JSON, returns null on miss and on parse errors", async () => {
    redisInstance.get.mockResolvedValueOnce('{"a":1}');
    expect(await cache.get<{ a: number }>("k")).toEqual({ a: 1 });

    redisInstance.get.mockResolvedValueOnce(null);
    expect(await cache.get("k")).toBeNull();

    redisInstance.get.mockResolvedValueOnce("not json");
    expect(await cache.get("k")).toBeNull();
  });

  it("set serialises with EX when ttl is given and without it otherwise", async () => {
    await cache.set("k", { a: 1 }, 60);
    expect(redisInstance.set).toHaveBeenCalledWith("k", '{"a":1}', "EX", 60);

    await cache.set("k", "v");
    expect(redisInstance.set).toHaveBeenLastCalledWith("k", '"v"');
  });

  it("setIfAbsent uses NX and reports success/failure", async () => {
    redisInstance.set.mockResolvedValueOnce("OK");
    expect(await cache.setIfAbsent("k", "v", 30)).toBe(true);
    expect(redisInstance.set).toHaveBeenCalledWith("k", '"v"', "EX", 30, "NX");

    redisInstance.set.mockResolvedValueOnce(null);
    expect(await cache.setIfAbsent("k", "v")).toBe(false);
  });

  it("has reflects the EXISTS result", async () => {
    redisInstance.exists.mockResolvedValueOnce(1);
    expect(await cache.has("k")).toBe(true);
    redisInstance.exists.mockResolvedValueOnce(0);
    expect(await cache.has("k")).toBe(false);
  });

  it("delete and clear forward to DEL and FLUSHDB", async () => {
    await cache.delete("k");
    expect(redisInstance.del).toHaveBeenCalledWith("k");
    await cache.clear();
    expect(redisInstance.flushdb).toHaveBeenCalled();
  });

  it("increment uses EVAL when ttl is supplied so EXPIRE only fires on first INCR", async () => {
    redisInstance.eval.mockResolvedValueOnce(3);
    const v = await cache.increment("counter", 60);
    expect(v).toBe(3);
    expect(redisInstance.eval).toHaveBeenCalled();
    const [script, keys, key, ttl] = redisInstance.eval.mock.calls[0];
    expect(typeof script).toBe("string");
    expect(keys).toBe(1);
    expect(key).toBe("counter");
    expect(ttl).toBe("60");
  });

  it("increment falls back to plain INCR when no ttl is given", async () => {
    redisInstance.incr.mockResolvedValueOnce(1);
    expect(await cache.increment("c")).toBe(1);
    expect(redisInstance.incr).toHaveBeenCalledWith("c");
  });

  it("returns 0 on increment errors", async () => {
    redisInstance.eval.mockRejectedValueOnce(new Error("boom"));
    expect(await cache.increment("c", 60)).toBe(0);
  });

  it("does not throw when the underlying set/delete/flush calls fail", async () => {
    redisInstance.set.mockRejectedValueOnce(new Error("x"));
    await cache.set("k", "v", 30);

    redisInstance.del.mockRejectedValueOnce(new Error("x"));
    await cache.delete("k");

    redisInstance.flushdb.mockRejectedValueOnce(new Error("x"));
    await cache.clear();
  });
});
