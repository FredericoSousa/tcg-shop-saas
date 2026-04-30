import { describe, it, expect, beforeEach, vi } from "vitest";
import { enqueueDomainEvent } from "@/lib/domain/events/outbox-publisher";
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import type { IOutboxRepository } from "@/lib/domain/repositories/outbox.repository";
import { mock, MockProxy } from "vitest-mock-extended";

describe("enqueueDomainEvent", () => {
  let outbox: MockProxy<IOutboxRepository>;

  beforeEach(() => {
    outbox = mock<IOutboxRepository>();
    vi.spyOn(container, "resolve").mockImplementation((token: unknown) => {
      if (token === TOKENS.OutboxRepository) return outbox;
      return {} as never;
    });
  });

  it("forwards the call to the outbox repository together with the tx", async () => {
    const tx = Symbol("tx");
    await enqueueDomainEvent("order.placed", { orderId: "o1" }, "t1", tx);

    expect(outbox.enqueue).toHaveBeenCalledWith(
      "order.placed",
      { orderId: "o1" },
      "t1",
      tx,
    );
  });

  it("accepts a null tenantId for tenant-agnostic events", async () => {
    await enqueueDomainEvent("system.tick", {}, null, undefined);
    expect(outbox.enqueue).toHaveBeenCalledWith("system.tick", {}, null, undefined);
  });
});
