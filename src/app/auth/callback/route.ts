import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseProxyClient } from "@/lib/supabase/proxy-client";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/admin";
  const tenantId = request.headers.get("x-tenant-id");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  const { supabase, applyCookiesTo } = createSupabaseProxyClient(request);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    logger.warn("OAuth callback: exchange failed", {
      action: "oauth_callback",
      error: error?.message,
    });
    return NextResponse.redirect(new URL("/login?error=oauth_exchange", request.url));
  }

  const meta = data.user.app_metadata as { tenantId?: string; role?: "ADMIN" | "USER" };

  if (!meta?.tenantId || (tenantId && meta.tenantId !== tenantId)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=tenant_mismatch", request.url));
  }

  return applyCookiesTo(NextResponse.redirect(new URL(next, request.url)));
}
