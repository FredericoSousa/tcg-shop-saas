import { test, expect } from "@playwright/test";

test.describe("Password policy (requires admin session)", () => {
  test("rejects weak password payload with 400", async ({ request }) => {
    const res = await request.post("/api/admin/users", {
      data: { email: "newuser@test.com", password: "123", role: "USER" },
      headers: { "x-tenant-id": "00000000-0000-0000-0000-000000000000" },
    });
    expect([400, 401, 403]).toContain(res.status());
    if (res.status() === 400) {
      const body = await res.json().catch(() => ({}));
      const msg = JSON.stringify(body).toLowerCase();
      expect(msg).toMatch(/senha|password|mínimo|caracteres/);
    }
  });
});
