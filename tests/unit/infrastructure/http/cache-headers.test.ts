import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import {
  jsonWithCache,
  CACHE_POLICIES,
} from "@/lib/infrastructure/http/cache-headers";

function req(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("https://example.com/api/test", { headers });
}

describe("jsonWithCache", () => {
  it("returns 200 with ETag, Cache-Control and Vary headers", async () => {
    const res = jsonWithCache(
      req(),
      { hello: "world" },
      CACHE_POLICIES.storefrontCatalog,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("ETag")).toMatch(/^W\/"[a-f0-9]+"$/);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=300");
    expect(res.headers.get("Vary")).toContain("x-tenant-id");
  });

  it("emits 304 when If-None-Match matches the ETag", async () => {
    const first = jsonWithCache(
      req(),
      { hello: "world" },
      CACHE_POLICIES.storefrontCatalog,
    );
    const etag = first.headers.get("ETag")!;
    const second = jsonWithCache(
      req({ "if-none-match": etag }),
      { hello: "world" },
      CACHE_POLICIES.storefrontCatalog,
    );
    expect(second.status).toBe(304);
    expect(second.headers.get("ETag")).toBe(etag);
  });

  it("changes the ETag when the body changes", async () => {
    const a = jsonWithCache(req(), { x: 1 }, CACHE_POLICIES.storefrontCatalog);
    const b = jsonWithCache(req(), { x: 2 }, CACHE_POLICIES.storefrontCatalog);
    expect(a.headers.get("ETag")).not.toBe(b.headers.get("ETag"));
  });
});
