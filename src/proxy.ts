import "reflect-metadata";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "./lib/rate-limiter";
import { generateNonce } from "./lib/security/csp";
import { requiresCsrfCheck, isOriginAllowed } from "./lib/security/csrf";
import { createSupabaseProxyClient } from "./lib/supabase/proxy-client";
import { getUserTenantId } from "./lib/supabase/user-metadata";
import { extractSubdomain, resolveTenantId } from "./lib/proxy/tenant-resolver";
import { selectRateLimitPolicy } from "./lib/proxy/rate-limit-policy";
import { getClientIp } from "./lib/proxy/client-ip";
import { applySecurityHeaders, jsonError } from "./lib/proxy/responses";

const PROTECTED_ROUTES = ["/admin"];

function enforceCsrf(request: NextRequest): NextResponse | null {
  if (!requiresCsrfCheck(request)) return null;
  if (isOriginAllowed(request)) return null;
  return jsonError(403, "Origem não autorizada.", "CSRF_ORIGIN_MISMATCH");
}

async function enforceRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const policy = selectRateLimitPolicy(request.nextUrl.pathname, request.method);
  if (!policy) return null;

  const ip = getClientIp(request);
  const result = await checkRateLimit(`${policy.bucket}:${ip}`, policy.config);
  if (result.allowed) return null;

  return jsonError(429, "Too many requests. Try again later.", "RATE_LIMIT_EXCEEDED", {
    "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
    "X-RateLimit-Limit": String(policy.config.limit),
    "X-RateLimit-Remaining": "0",
  });
}

function buildForwardHeaders(request: NextRequest, nonce: string, tenantId: string | null): Headers {
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  if (tenantId) headers.set("x-tenant-id", tenantId);
  return headers;
}

async function handleAuthSensitivePath(
  request: NextRequest,
  tenantId: string | null,
  forwardHeaders: Headers,
  nonce: string,
  opts: { isProtected: boolean; isLogin: boolean },
): Promise<NextResponse> {
  const { supabase, applyCookiesTo } = createSupabaseProxyClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (opts.isProtected) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const userTenantId = getUserTenantId(user);
    if (tenantId && userTenantId !== tenantId) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=tenant_mismatch", request.url));
    }
  }

  if (opts.isLogin && user) {
    const userTenantId = getUserTenantId(user);
    if (!tenantId || userTenantId === tenantId) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  const response = applyCookiesTo(
    NextResponse.next({ request: { headers: forwardHeaders } }),
  );
  return applySecurityHeaders(response, nonce);
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";
  const nonce = generateNonce();

  const csrfBlock = enforceCsrf(request);
  if (csrfBlock) return csrfBlock;

  const rateLimitBlock = await enforceRateLimit(request);
  if (rateLimitBlock) return rateLimitBlock;

  const subdomain = extractSubdomain(hostname);
  const tenantId = subdomain ? await resolveTenantId(subdomain) : null;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isLogin = pathname === "/login";
  const isAuthRoute = isLogin || pathname.startsWith("/auth/");

  const forwardHeaders = buildForwardHeaders(request, nonce, tenantId);

  if (isProtected || isAuthRoute) {
    return handleAuthSensitivePath(request, tenantId, forwardHeaders, nonce, {
      isProtected,
      isLogin,
    });
  }

  return applySecurityHeaders(
    NextResponse.next({ request: { headers: forwardHeaders } }),
    nonce,
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
