import { describe, it, expect } from "vitest";
import { generateNonce, buildCspHeader } from "@/lib/security/csp";

describe("generateNonce", () => {
  it("returns a base64-encoded 16-byte value (≥22 chars)", () => {
    const nonce = generateNonce();
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(nonce.length).toBeGreaterThanOrEqual(22);
  });

  it("returns distinct values across calls", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
  });
});

describe("buildCspHeader", () => {
  it("uses strict-dynamic with the supplied nonce in production", () => {
    const csp = buildCspHeader("xyz", false);
    expect(csp).toContain("'nonce-xyz'");
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain("'unsafe-inline'");
  });

  it("permits unsafe-eval and unsafe-inline (style only) in dev", () => {
    const csp = buildCspHeader("dev", true);
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("'unsafe-inline'");
  });

  it("includes hardening directives that lock down framing and form actions", () => {
    const csp = buildCspHeader("n", false);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("allows the Scryfall and Supabase image hosts", () => {
    const csp = buildCspHeader("n", false);
    expect(csp).toContain("https://cards.scryfall.io");
    expect(csp).toContain("https://*.supabase.co");
  });
});
