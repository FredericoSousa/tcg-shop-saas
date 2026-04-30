import { describe, it, expect, beforeEach, vi } from "vitest";
import { auditLogHandler } from "@/lib/application/events/audit-handlers";
import { notificationHandler } from "@/lib/application/events/notification-handlers";
import { logger } from "@/lib/logger";

describe("auditLogHandler", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    infoSpy = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    infoSpy.mockClear();
  });

  it("logs the event name with the most specific resourceId available", () => {
    auditLogHandler("order.paid", { tenantId: "t1", orderId: "o1", userId: "u1" });
    const ctx = infoSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(ctx.tenantId).toBe("t1");
    expect(ctx.resourceId).toBe("o1");
    expect(ctx.actorId).toBe("u1");
  });

  it("falls back to 'system' actor when no userId is present", () => {
    auditLogHandler("inventory.deleted", { tenantId: "t1", inventoryId: "i1" });
    expect((infoSpy.mock.calls[0][1] as Record<string, unknown>).actorId).toBe("system");
  });
});

describe("notificationHandler", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    infoSpy = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    infoSpy.mockClear();
  });

  it("notifies the admin when a buylist proposal is submitted", async () => {
    await notificationHandler("buylist.proposal_submitted", { proposalId: "abcd1234efgh" });
    expect(infoSpy).toHaveBeenCalled();
    expect(String(infoSpy.mock.calls[0][0])).toContain("Buylist Proposal");
  });

  it("notifies the customer when their order is paid", async () => {
    await notificationHandler("order.paid", {
      orderId: "11112222333344445555",
      tenantId: "t1",
      customerId: "c1",
      totalAmount: 10,
      payments: [],
    });
    expect(String(infoSpy.mock.calls[0][0])).toContain("Order #");
  });

  it("notifies staff after a bulk import (and only then)", async () => {
    await notificationHandler("inventory.updated", {
      tenantId: "t1",
      cardIds: ["a", "b"],
      source: "bulk_import",
    });
    expect(String(infoSpy.mock.calls[0][0])).toContain("Bulk import");

    infoSpy.mockClear();
    await notificationHandler("inventory.updated", {
      tenantId: "t1",
      source: "ad_hoc",
    });
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("ignores unknown events", async () => {
    await notificationHandler("totally.unknown", {});
    expect(infoSpy).not.toHaveBeenCalled();
  });
});
