import { describe, it, expect, vi, afterEach } from "vitest";
import { NextResponse } from "next/server";
import {
  generateCorrelationId,
  jsonError,
  applySecurityHeaders,
} from "@/lib/proxy/responses";

describe("generateCorrelationId", () => {
  it("returns a UUID-shaped string", () => {
    const id = generateCorrelationId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("returns distinct values across calls", () => {
    const a = generateCorrelationId();
    const b = generateCorrelationId();
    expect(a).not.toBe(b);
  });
});

describe("jsonError", () => {
  it("emits a JSON body with success=false and the requested status", async () => {
    const response = jsonError(429, "slow down", "RATE_LIMIT");
    expect(response.status).toBe(429);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      message: "slow down",
      error: { code: "RATE_LIMIT" },
    });
  });

  it("merges extra headers like Retry-After", () => {
    const response = jsonError(429, "x", "Y", { "Retry-After": "30" });
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });
});

describe("applySecurityHeaders", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sets x-nonce and a CSP header containing the nonce", () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = applySecurityHeaders(NextResponse.next(), "abc123");
    expect(res.headers.get("x-nonce")).toBe("abc123");
    const csp = res.headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("nonce-abc123");
    expect(csp).toContain("default-src 'self'");
  });

  it("includes 'unsafe-eval' in dev to allow Next dev-server hot reload", () => {
    vi.stubEnv("NODE_ENV", "development");
    const res = applySecurityHeaders(NextResponse.next(), "n");
    expect(res.headers.get("Content-Security-Policy")).toContain("'unsafe-eval'");
  });
});
