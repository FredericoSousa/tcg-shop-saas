import { test, expect } from "@playwright/test";

test.describe("Security headers", () => {
  test("responses include hardened CSP and security headers", async ({ request }) => {
    const res = await request.get("/");
    expect(res.status()).toBeLessThan(500);

    const csp = res.headers()["content-security-policy"];
    expect(csp).toBeTruthy();

    const scriptSrcMatch = csp.match(/script-src ([^;]+)/);
    expect(scriptSrcMatch).toBeTruthy();
    const scriptSrc = scriptSrcMatch![1];
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
    expect(scriptSrc).toContain("'strict-dynamic'");

    if (process.env.NODE_ENV === "production") {
      expect(scriptSrc).not.toContain("'unsafe-eval'");
    }

    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("object-src 'none'");

    expect(res.headers()["x-frame-options"]).toBe("DENY");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    expect(res.headers()["strict-transport-security"]).toContain("max-age=");
  });
});

test.describe("Protected endpoints", () => {
  const protectedPost = [
    "/api/inventory/import-ligamagic",
    "/api/scryfall/resolve-batch",
    "/api/scryfall/search-by-name",
  ];

  for (const path of protectedPost) {
    test(`POST ${path} returns 401/403 without session`, async ({ request }) => {
      const res = await request.post(path, { data: {} });
      expect([401, 403]).toContain(res.status());
    });
  }

  test("GET /api/admin/pos/order-in-progress returns 401 without session", async ({ request }) => {
    const res = await request.get("/api/admin/pos/order-in-progress?customerId=00000000-0000-0000-0000-000000000000");
    expect([401, 403]).toContain(res.status());
  });

  test("GET /api/tenant returns 401 without session", async ({ request }) => {
    const res = await request.get("/api/tenant");
    expect([401, 403]).toContain(res.status());
  });
});

test.describe("CSRF protection", () => {
  test("POST with foreign Origin is rejected with 403", async ({ request }) => {
    const res = await request.post("/api/checkout", {
      data: {},
      headers: {
        Origin: "https://attacker.example.com",
        "Content-Type": "application/json",
      },
    });
    expect(res.status()).toBe(403);
    const body = await res.json().catch(() => null);
    if (body?.error?.code) {
      expect(body.error.code).toBe("CSRF_ORIGIN_MISMATCH");
    }
  });

  test("POST without Origin or Referer is rejected", async ({ request }) => {
    const res = await request.fetch("/api/checkout", {
      method: "POST",
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect([401, 403]).toContain(res.status());
  });
});

test.describe("Auth", () => {
  test("login page renders without session", async ({ page }) => {
    const res = await page.goto("/login");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
  });

  test("protected admin page redirects to /login when unauthenticated", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Health check", () => {
  test("GET /api/health returns 200", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
  });
});
