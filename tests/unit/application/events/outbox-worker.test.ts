import { describe, it, expect, beforeEach, vi } from "vitest";
import { drainOutbox } from "@/lib/application/events/outbox-worker";
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import type {
  IOutboxRepository,
  OutboxEvent,
} from "@/lib/domain/repositories/outbox.repository";
import { domainEvents } from "@/lib/domain/events/domain-events";
import { mock, MockProxy } from "vitest-mock-extended";

function event(overrides: Partial<OutboxEvent> = {}): OutboxEvent {
  return {
    id: "ev-1",
    tenantId: "t1",
    eventName: "order.placed",
    payload: { orderId: "o1" },
    createdAt: new Date(),
    processedAt: null,
    attempts: 0,
    lastError: null,
    ...overrides,
  };
}

describe("drainOutbox", () => {
  let outbox: MockProxy<IOutboxRepository>;
  let publishSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    outbox = mock<IOutboxRepository>();
    vi.spyOn(container, "resolve").mockImplementation((token: unknown) => {
      if (token === TOKENS.OutboxRepository) return outbox;
      return {} as never;
    });
    publishSpy = vi.spyOn(domainEvents, "publish").mockResolvedValue(undefined);
    publishSpy.mockClear();
  });

  it("publishes each event and stamps it processed on success", async () => {
    outbox.pickPending.mockResolvedValue([event({ id: "a" }), event({ id: "b" })]);

    const result = await drainOutbox(10);

    expect(result).toEqual({ picked: 2, processed: 2, failed: 0 });
    expect(publishSpy).toHaveBeenCalledTimes(2);
    expect(outbox.markProcessed).toHaveBeenCalledWith("a");
    expect(outbox.markProcessed).toHaveBeenCalledWith("b");
  });

  it("records a failure when publish throws and increments attempts", async () => {
    outbox.pickPending.mockResolvedValue([event({ id: "x" })]);
    publishSpy.mockRejectedValueOnce(new Error("boom"));

    const result = await drainOutbox(10);

    expect(result).toEqual({ picked: 1, processed: 0, failed: 1 });
    expect(outbox.recordFailure).toHaveBeenCalledWith("x", "boom");
    expect(outbox.markProcessed).not.toHaveBeenCalled();
  });

  it("skips events that already exceeded MAX_ATTEMPTS without retrying", async () => {
    outbox.pickPending.mockResolvedValue([event({ id: "stuck", attempts: 10 })]);

    const result = await drainOutbox();

    expect(result.processed).toBe(0);
    expect(result.failed).toBe(0);
    expect(publishSpy).not.toHaveBeenCalled();
    expect(outbox.markProcessed).not.toHaveBeenCalled();
  });

  it("returns zeros when the queue is empty", async () => {
    outbox.pickPending.mockResolvedValue([]);
    expect(await drainOutbox()).toEqual({ picked: 0, processed: 0, failed: 0 });
  });
});
