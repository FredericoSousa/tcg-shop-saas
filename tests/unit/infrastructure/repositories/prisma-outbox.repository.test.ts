import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma as prismaMock } from "@/lib/prisma";
import { PrismaOutboxRepository } from "@/lib/infrastructure/repositories/prisma-outbox.repository";

describe("PrismaOutboxRepository", () => {
  let repository: PrismaOutboxRepository;

  beforeEach(() => {
    mockReset(prismaMock);
    repository = new PrismaOutboxRepository();
  });

  it("enqueue writes a row with the event name, tenant and payload", async () => {
    await repository.enqueue("order.placed", { orderId: "o1" }, "t1");
    expect(prismaMock.outboxEvent.create).toHaveBeenCalledWith({
      data: {
        eventName: "order.placed",
        tenantId: "t1",
        payload: { orderId: "o1" },
      },
    });
  });

  it("enqueue uses the supplied tx client when present", async () => {
    const tx = mockDeep<PrismaClient>();
    await repository.enqueue("e", {}, null, tx);

    expect(tx.outboxEvent.create).toHaveBeenCalled();
    expect(prismaMock.outboxEvent.create).not.toHaveBeenCalled();
  });

  it("pickPending returns rows ordered by createdAt ASC for unprocessed events", async () => {
    const now = new Date();
    (prismaMock.outboxEvent.findMany as any).mockResolvedValue([
      {
        id: "ev",
        tenantId: "t1",
        eventName: "x",
        payload: { a: 1 },
        createdAt: now,
        processedAt: null,
        attempts: 0,
        lastError: null,
      },
    ]);

    const out = await repository.pickPending(50);

    expect(prismaMock.outboxEvent.findMany).toHaveBeenCalledWith({
      where: { processedAt: null, deadLetteredAt: null },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
    expect(out[0]).toMatchObject({ id: "ev", eventName: "x" });
  });

  it("markProcessed stamps processedAt", async () => {
    await repository.markProcessed("ev-1");
    expect(prismaMock.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: "ev-1" },
      data: { processedAt: expect.any(Date) },
    });
  });

  it("recordFailure increments attempts and truncates the error message", async () => {
    const long = "x".repeat(700);
    await repository.recordFailure("ev-1", long);
    expect(prismaMock.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: "ev-1" },
      data: {
        attempts: { increment: 1 },
        lastError: "x".repeat(500),
      },
    });
  });
});
