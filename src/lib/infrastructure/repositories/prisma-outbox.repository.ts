import { injectable } from "tsyringe";
import { Prisma } from "@prisma/client";
import { BasePrismaRepository } from "./base-prisma.repository";
import type {
  IOutboxRepository,
  OutboxEvent,
} from "@/lib/domain/repositories/outbox.repository";

@injectable()
export class PrismaOutboxRepository
  extends BasePrismaRepository
  implements IOutboxRepository
{
  async enqueue(
    eventName: string,
    payload: unknown,
    tenantId: string | null,
    tx?: unknown,
  ): Promise<void> {
    const client = (tx as Prisma.TransactionClient) || this.prisma;
    await client.outboxEvent.create({
      data: {
        eventName,
        tenantId,
        payload: payload as Prisma.InputJsonValue,
      },
    });
  }

  async pickPending(limit: number): Promise<OutboxEvent[]> {
    const rows = await this.prisma.outboxEvent.findMany({
      where: { processedAt: null, deadLetteredAt: null },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    return rows.map(r => this.toDomain(r));
  }

  async markProcessed(id: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: { processedAt: new Date() },
    });
  }

  async recordFailure(id: string, error: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
        lastError: error.slice(0, 500),
      },
    });
  }

  async markDeadLettered(id: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: { deadLetteredAt: new Date() },
    });
  }

  async listDead(limit: number): Promise<OutboxEvent[]> {
    const rows = await this.prisma.outboxEvent.findMany({
      where: { deadLetteredAt: { not: null } },
      orderBy: { deadLetteredAt: "desc" },
      take: limit,
    });
    return rows.map(r => this.toDomain(r));
  }

  async requeue(id: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        attempts: 0,
        lastError: null,
        deadLetteredAt: null,
        processedAt: null,
      },
    });
  }

  async stats(): Promise<{ pending: number; deadLettered: number }> {
    const [pending, deadLettered] = await Promise.all([
      this.prisma.outboxEvent.count({
        where: { processedAt: null, deadLetteredAt: null },
      }),
      this.prisma.outboxEvent.count({
        where: { deadLetteredAt: { not: null } },
      }),
    ]);
    return { pending, deadLettered };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(r: any): OutboxEvent {
    return {
      id: r.id,
      tenantId: r.tenantId,
      eventName: r.eventName,
      payload: r.payload,
      createdAt: r.createdAt,
      processedAt: r.processedAt,
      attempts: r.attempts,
      lastError: r.lastError,
      deadLetteredAt: r.deadLetteredAt ?? null,
    };
  }
}
