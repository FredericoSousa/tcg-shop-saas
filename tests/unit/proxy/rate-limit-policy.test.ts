import { describe, it, expect } from "vitest";
import { selectRateLimitPolicy } from "@/lib/proxy/rate-limit-policy";

describe("selectRateLimitPolicy", () => {
  it("matches /login to the auth bucket with the tightest tier", () => {
    const decision = selectRateLimitPolicy("/login", "POST");
    expect(decision).not.toBeNull();
    expect(decision!.bucket).toBe("auth");
    expect(decision!.config.limit).toBe(10);
    expect(decision!.config.windowSeconds).toBe(60);
  });

  it("matches /api/auth/* to the auth bucket", () => {
    expect(selectRateLimitPolicy("/api/auth/login", "POST")?.bucket).toBe("auth");
  });

  it("matches /api/checkout to its dedicated bucket before the generic /api fallback", () => {
    const decision = selectRateLimitPolicy("/api/checkout", "POST");
    expect(decision?.bucket).toBe("checkout");
    expect(decision?.config.limit).toBe(15);
  });

  it("falls through to the api bucket for arbitrary /api/* routes", () => {
    const decision = selectRateLimitPolicy("/api/inventory/items", "GET");
    expect(decision?.bucket).toBe("api");
    expect(decision?.config.limit).toBe(60);
  });

  it("returns null for non-API paths", () => {
    expect(selectRateLimitPolicy("/admin/orders", "GET")).toBeNull();
    expect(selectRateLimitPolicy("/", "GET")).toBeNull();
  });
});
