import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractSubdomain, resolveTenantId } from "@/lib/proxy/tenant-resolver";
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import { GetTenantUseCase } from "@/lib/application/use-cases/tenant/get-tenant.use-case";

describe("extractSubdomain", () => {
  it.each([
    ["acme.example.com", "acme"],
    ["foo.localhost:3000", "foo"],
    ["bar.local", "bar"],
  ])("returns the leading label of %s", (host, expected) => {
    expect(extractSubdomain(host)).toBe(expected);
  });

  it("returns null for www / localhost / hostnames carrying a port", () => {
    expect(extractSubdomain("www.example.com")).toBeNull();
    expect(extractSubdomain("localhost")).toBeNull();
    expect(extractSubdomain("localhost:3000")).toBeNull();
  });

  it("returns null for an empty hostname", () => {
    expect(extractSubdomain("")).toBeNull();
  });
});

describe("resolveTenantId", () => {
  const cache = {
    get: vi.fn(),
    set: vi.fn(),
    setIfAbsent: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    increment: vi.fn(),
  };

  const useCase = { execute: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(container, "resolve").mockImplementation((token: unknown) => {
      if (token === TOKENS.CacheService) return cache;
      if (token === GetTenantUseCase) return useCase;
      return {} as never;
    });
  });

  it("returns the cached tenantId without hitting the use case", async () => {
    cache.get.mockResolvedValue("tenant-cached");

    const id = await resolveTenantId("acme");

    expect(id).toBe("tenant-cached");
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it("resolves through the use case and warms the cache on a miss", async () => {
    cache.get.mockResolvedValue(null);
    useCase.execute.mockResolvedValue({ id: "tenant-1" });

    const id = await resolveTenantId("acme");

    expect(id).toBe("tenant-1");
    expect(cache.set).toHaveBeenCalledWith("tenant:slug:acme", "tenant-1", 60);
  });

  it("returns null and does not throw when the use case errors", async () => {
    cache.get.mockResolvedValue(null);
    useCase.execute.mockRejectedValue(new Error("db down"));

    const id = await resolveTenantId("acme");

    expect(id).toBeNull();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it("returns null when the use case finds no tenant", async () => {
    cache.get.mockResolvedValue(null);
    useCase.execute.mockResolvedValue(null);

    const id = await resolveTenantId("ghost");

    expect(id).toBeNull();
  });
});
