import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import type { IOutboxRepository } from "@/lib/domain/repositories/outbox.repository";
import { withRLSBypass } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Ops endpoint for the outbox dead-letter queue. Protected by the
 * shared CRON_SECRET because it spans all tenants (RLS bypassed).
 *
 *   GET            → list dead-lettered events + counts
 *   POST   {id}    → requeue one event
 */

function authorize(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  const presented = request.headers.get("authorization");
  return Boolean(expected) && presented === `Bearer ${expected}`;
}

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") ?? 100),
    500,
  );

  const result = await withRLSBypass(async () => {
    const outbox = container.resolve<IOutboxRepository>(TOKENS.OutboxRepository);
    const [events, stats] = await Promise.all([
      outbox.listDead(limit),
      outbox.stats(),
    ]);
    return { events, stats };
  });

  return NextResponse.json({ success: true, ...result });
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "invalid json" },
      { status: 400 },
    );
  }

  if (!body.id || typeof body.id !== "string") {
    return NextResponse.json(
      { success: false, error: "id is required" },
      { status: 400 },
    );
  }

  await withRLSBypass(async () => {
    const outbox = container.resolve<IOutboxRepository>(TOKENS.OutboxRepository);
    await outbox.requeue(body.id!);
  });

  logger.info("outbox event requeued", { action: "outbox_requeue", outboxEventId: body.id });
  return NextResponse.json({ success: true });
}
