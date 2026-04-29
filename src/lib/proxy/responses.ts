import { NextResponse } from "next/server";
import { buildCspHeader } from "../security/csp";

export function generateCorrelationId(): string {
  // crypto.randomUUID is available in both Node and Edge runtimes.
  return crypto.randomUUID();
}

export function jsonError(status: number, message: string, code: string, extraHeaders: Record<string, string> = {}): NextResponse {
  return new NextResponse(
    JSON.stringify({ success: false, message, error: { code } }),
    {
      status,
      headers: { "Content-Type": "application/json", ...extraHeaders },
    },
  );
}

export function applySecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  const isDev = process.env.NODE_ENV !== "production";
  response.headers.set("Content-Security-Policy", buildCspHeader(nonce, isDev));
  response.headers.set("x-nonce", nonce);
  return response;
}
