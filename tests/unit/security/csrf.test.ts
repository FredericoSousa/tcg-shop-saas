import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { requiresCsrfCheck, isOriginAllowed } from "@/lib/security/csrf";

function makeRequest(opts: {
  method?: string;
  pathname?: string;
  origin?: string | null;
  referer?: string | null;
  host?: string | null;
}): NextRequest {
  const headers: Record<string, string> = {};
  if (opts.host) headers["host"] = opts.host;
  if (opts.origin) headers["origin"] = opts.origin;
  if (opts.referer) headers["referer"] = opts.referer;

  const url = `http://${opts.host ?? "example.com"}${opts.pathname ?? "/"}`;
  return new NextRequest(url, {
    method: opts.method ?? "GET",
    headers,
  });
}

describe("requiresCsrfCheck", () => {
  it("ignores safe methods", () => {
    expect(
      requiresCsrfCheck(makeRequest({ method: "GET", pathname: "/api/orders" })),
    ).toBe(false);
  });

  it("ignores routes outside /api", () => {
    expect(
      requiresCsrfCheck(makeRequest({ method: "POST", pathname: "/admin" })),
    ).toBe(false);
  });

  it("requires CSRF for unsafe methods on /api/*", () => {
    expect(
      requiresCsrfCheck(makeRequest({ method: "POST", pathname: "/api/checkout" })),
    ).toBe(true);
    expect(
      requiresCsrfCheck(makeRequest({ method: "DELETE", pathname: "/api/admin/users/1" })),
    ).toBe(true);
  });

  it("whitelists the public auth endpoints", () => {
    expect(
      requiresCsrfCheck(makeRequest({ method: "POST", pathname: "/api/auth/login" })),
    ).toBe(false);
    expect(
      requiresCsrfCheck(makeRequest({ method: "POST", pathname: "/api/auth/logout" })),
    ).toBe(false);
  });
});

describe("isOriginAllowed", () => {
  it("accepts a same-origin Origin header", () => {
    expect(
      isOriginAllowed(makeRequest({ host: "shop.example.com", origin: "https://shop.example.com" })),
    ).toBe(true);
  });

  it("falls back to the Referer header when Origin is missing", () => {
    expect(
      isOriginAllowed(makeRequest({ host: "shop.example.com", referer: "https://shop.example.com/cart" })),
    ).toBe(true);
  });

  it("rejects a cross-origin request", () => {
    expect(
      isOriginAllowed(makeRequest({ host: "shop.example.com", origin: "https://evil.example.com" })),
    ).toBe(false);
  });

  it("rejects when both headers are missing", () => {
    expect(isOriginAllowed(makeRequest({ host: "shop.example.com" }))).toBe(false);
  });

  it("rejects when host is missing entirely", () => {
    const req = new NextRequest("http://placeholder/", { method: "POST" });
    req.headers.delete("host");
    expect(isOriginAllowed(req)).toBe(false);
  });

  it("rejects malformed Origin values", () => {
    expect(
      isOriginAllowed(makeRequest({ host: "shop.example.com", origin: "not a url" })),
    ).toBe(false);
  });
});
