import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import {
  deliverWebhook,
  signPayload,
  __resetWebhookBreakersForTests,
} from "@/lib/application/events/webhook-handlers";
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import type { ITenantRepository } from "@/lib/domain/repositories/tenant.repository";

function tenant(overrides: Partial<{ webhookUrl: string | null; webhookSecret: string | null }> = {}) {
  return {
    id: "t1",
    slug: "loja",
    name: "Loja",
    active: true,
    brandColor: null,
    logoUrl: null,
    faviconUrl: null,
    description: null,
    address: null,
    phone: null,
    email: null,
    instagram: null,
    whatsapp: null,
    facebook: null,
    twitter: null,
    webhookUrl: "https://hooks.example.com/x",
    webhookSecret: "shh",
    ...overrides,
  };
}

describe("signPayload", () => {
  it("matches the canonical timestamp.body HMAC-SHA256 hex digest", () => {
    const expected = createHmac("sha256", "secret").update("100.body").digest("hex");
    expect(signPayload("secret", "body", 100)).toBe(expected);
  });
});

describe("deliverWebhook", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let tenantRepo: { findById: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    __resetWebhookBreakersForTests();
    tenantRepo = { findById: vi.fn() };
    vi.spyOn(container, "resolve").mockImplementation((token: unknown) => {
      if (token === TOKENS.TenantRepository) return tenantRepo as unknown as ITenantRepository;
      return {} as never;
    });
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("no-ops silently when the tenant has no webhook configured", async () => {
    tenantRepo.findById.mockResolvedValue(tenant({ webhookUrl: null }));
    await deliverWebhook({ eventName: "order.placed", tenantId: "t1", data: { x: 1 } });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts a signed payload with the canonical headers", async () => {
    tenantRepo.findById.mockResolvedValue(tenant());
    fetchSpy.mockResolvedValue(new Response(null, { status: 200 }));

    await deliverWebhook({
      eventName: "order.placed",
      tenantId: "t1",
      data: { orderId: "o1" },
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://hooks.example.com/x");
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Webhook-Event"]).toBe("order.placed");
    expect(headers["X-Webhook-Signature"]).toMatch(/^sha256=[a-f0-9]+$/);
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ eventName: "order.placed", data: { orderId: "o1" } });
  });

  it("retries and finally throws when the receiver keeps returning 500", async () => {
    tenantRepo.findById.mockResolvedValue(tenant());
    fetchSpy.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(
      deliverWebhook({ eventName: "order.placed", tenantId: "t1", data: {} }),
    ).rejects.toThrow();

    // 3 attempts (configured baseline)
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
