import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { config } from "../config";

/**
 * Creates a Supabase client bound to the incoming request/response cookie lifecycle.
 * Cookie writes during token refresh are captured and can be flushed into a
 * final NextResponse via `applyCookiesTo(response)`.
 */
export function createSupabaseProxyClient(request: NextRequest) {
  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          pendingCookies.push({ name, value, options: options ?? {} });
        });
      },
    },
  });

  return {
    supabase,
    applyCookiesTo(response: NextResponse) {
      pendingCookies.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options),
      );
      return response;
    },
  };
}
