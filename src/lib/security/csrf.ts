import type { NextRequest } from "next/server";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const PUBLIC_UNSAFE_PATHS = [
  "/api/auth/login",
  "/api/auth/logout",
];

export function requiresCsrfCheck(req: NextRequest): boolean {
  if (!UNSAFE_METHODS.has(req.method)) return false;
  const pathname = req.nextUrl.pathname;
  if (!pathname.startsWith("/api/")) return false;
  if (PUBLIC_UNSAFE_PATHS.includes(pathname)) return false;
  return true;
}

export function isOriginAllowed(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  if (!host) return false;

  const source = origin ?? referer;
  if (!source) return false;

  try {
    const url = new URL(source);
    return url.host === host;
  } catch {
    return false;
  }
}
