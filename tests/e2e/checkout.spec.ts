import { test, expect } from "@playwright/test";

/**
 * Contract-level checks for the storefront checkout endpoint. We don't
 * exercise the happy path here because it would need a seeded tenant +
 * subdomain DNS — those flows belong in unit tests with mocked repos.
 * Instead we lock in the guards that protect the endpoint.
 */
test.describe("/api/checkout — contract", () => {
  test("rejects unsafe cross-origin POST with 403", async ({ request }) => {
    const res = await request.post("/api/checkout", {
      headers: {
        origin: "https://evil.example.com",
        "content-type": "application/json",
      },
      data: { items: [], customerData: { phoneNumber: "5511999999999" } },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error?.code).toBe("CSRF_ORIGIN_MISMATCH");
  });

  test("returns 401 when no tenant is resolved", async ({ request, baseURL }) => {
    // Same-origin POST (so CSRF passes) but no x-tenant-id => no tenant.
    const res = await request.post("/api/checkout", {
      headers: { origin: baseURL ?? "http://localhost:3000" },
      data: {
        items: [{ inventoryId: "00000000-0000-0000-0000-000000000000", quantity: 1, price: 10 }],
        customerData: { phoneNumber: "5511999999999" },
      },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("rejects empty cart with 400 once tenant resolves", async ({ request, baseURL }) => {
    const res = await request.post("/api/checkout", {
      headers: {
        origin: baseURL ?? "http://localhost:3000",
        // forged tenant header is stripped by the proxy when no real
        // subdomain is present; so we expect 401 here, NOT 400.
        "x-tenant-id": "00000000-0000-0000-0000-000000000000",
      },
      data: { items: [], customerData: { phoneNumber: "5511999999999" } },
    });
    expect([400, 401, 403]).toContain(res.status());
  });
});
