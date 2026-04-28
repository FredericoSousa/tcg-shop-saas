import { test, expect } from "@playwright/test";

test.describe("/api/buylist/search — contract", () => {
  test("returns empty list when no tenant is resolved", async ({ request }) => {
    const res = await request.get("/api/buylist/search?q=lightning");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ items: [] });
  });
});

test.describe("/api/buylist/proposals — contract", () => {
  test("rejects cross-origin POST with 403", async ({ request }) => {
    const res = await request.post("/api/buylist/proposals", {
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

  test("rejects request without tenant", async ({ request, baseURL }) => {
    const res = await request.post("/api/buylist/proposals", {
      headers: { origin: baseURL ?? "http://localhost:3000" },
      data: { items: [], customerData: { phoneNumber: "5511999999999" } },
    });
    // No tenant on apex => 400 ("Tenant não identificado")
    expect([400, 401, 403]).toContain(res.status());
  });
});
