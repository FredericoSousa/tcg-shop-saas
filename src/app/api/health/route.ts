import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Health check endpoint for monitoring availability.
 * Checks database connectivity.
 */
export async function GET() {
  const start = Date.now();
  
  try {
    // Basic database connectivity check
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
      latency: `${Date.now() - start}ms`,
    });
  } catch (error) {
    logger.error("Health check failed", error as Error);
    
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: "Database connection failed",
      },
      { status: 503 }
    );
  }
}
