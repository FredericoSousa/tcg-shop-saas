import type { NextRequest, NextResponse } from "next/server";

/**
 * Clears Supabase auth cookies on the response without round-tripping to
 * the Supabase API. The Supabase SSR client stores the session in
 * cookies prefixed with `sb-` — wiping them is enough to invalidate the
 * server-side session for the next request. The actual remote sign-out
 * (server-side revocation) can happen lazily, off the redirect path.
 */
export function clearAuthCookies(request: NextRequest, response: NextResponse): NextResponse {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", { maxAge: 0, path: "/" });
    }
  }
  return response;
}
