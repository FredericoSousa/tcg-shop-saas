import { test, expect } from "@playwright/test";

test.describe("Multi-tenant isolation (requires seeded DB)", () => {
  test("requests without x-tenant-id header cannot resolve tenant-scoped endpoints", async ({ request }) => {
    const res = await request.get("/api/inventory");
    expect([401, 403, 404]).toContain(res.status());
  });

  test("cross-tenant access via forged x-tenant-id is rejected by session check", async ({ request }) => {
    const res = await request.get("/api/admin/users", {
      headers: { "x-tenant-id": "00000000-0000-0000-0000-000000000000" },
    });
    expect([401, 403]).toContain(res.status());
  });
});

test.describe("Rate limiting", () => {
  test("burst of requests eventually returns 429", async ({ request }) => {
    test.skip(
      process.env.NODE_ENV !== "production" && !process.env.CI,
      "Rate limit counter state is unreliable under Next dev/Turbopack HMR; run against a production build or in CI."
    );

    let rateLimited = false;
    for (let i = 0; i < 200; i++) {
      const res = await request.get("/api/health");
      if (res.status() === 429) {
        rateLimited = true;
        break;
      }
    }
    expect(rateLimited).toBe(true);
  });
});
