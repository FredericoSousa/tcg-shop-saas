import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { drainOutbox } from "@/lib/application/events/outbox-worker";
import { logger } from "@/lib/logger";

/**
 * Cron-triggered worker: drains pending outbox events.
 *
 * Protected by a shared secret in the `Authorization` header
 * (`Bearer <CRON_SECRET>`). Configure the scheduler (Vercel Cron,
 * external poller, …) to hit this endpoint every 30–60 seconds.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const presented = request.headers.get("authorization");

  if (!expected || presented !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await drainOutbox();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    logger.error("drain-outbox failed", err as Error);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
