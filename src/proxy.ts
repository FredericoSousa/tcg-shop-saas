import "reflect-metadata";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { container } from "./lib/infrastructure/container";
import { GetTenantUseCase } from "./lib/application/use-cases/get-tenant.use-case";
import { checkRateLimit } from "./lib/rate-limiter";
import { TOKENS } from "./lib/infrastructure/tokens";
import { ICacheService } from "./lib/infrastructure/cache/cache-service";
import { generateNonce, buildCspHeader } from "./lib/security/csp";
import { requiresCsrfCheck, isOriginAllowed } from "./lib/security/csrf";
import { logger } from "./lib/logger";
import { createSupabaseProxyClient } from "./lib/supabase/proxy-client";

const PROTECTED_ROUTES = ["/admin"];
const TENANT_CACHE_TTL = 60;

async function resolveTenantId(slug: string): Promise<string | null> {
  const cache = container.resolve<ICacheService>(TOKENS.CacheService);
  const cacheKey = `tenant:slug:${slug}`;

  const cachedId = await cache.get<string>(cacheKey);
  if (cachedId) return cachedId;

  try {
    const getTenantUseCase = container.resolve(GetTenantUseCase);
    const tenant = await getTenantUseCase.execute({ slug });
    if (tenant?.id) {
      await cache.set(cacheKey, tenant.id, TENANT_CACHE_TTL);
      return tenant.id;
    }
  } catch (err) {
    logger.warn("Proxy tenant lookup failed", {
      action: "proxy_tenant_lookup",
      slug,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return null;
}

function applySecurityHeaders(response: NextResponse, nonce: string) {
  const isDev = process.env.NODE_ENV !== "production";
  response.headers.set("Content-Security-Policy", buildCspHeader(nonce, isDev));
  response.headers.set("x-nonce", nonce);
  return response;
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;
  const hostname = request.headers.get("host") || "";

  const nonce = generateNonce();

  // ─── CSRF: reject unsafe cross-origin requests ────────────────────────────
  if (requiresCsrfCheck(request) && !isOriginAllowed(request)) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Origem não autorizada.",
        error: { code: "CSRF_ORIGIN_MISMATCH" },
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // ─── Rate Limiting nas rotas de API ───────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const result = await checkRateLimit(`api:${ip}`, { limit: 60, windowSeconds: 60 });

    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Too many requests. Try again later.", error: { code: "RATE_LIMIT_EXCEEDED" } }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Limit": "60",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // ─── Multi-tenant: subdomain routing ──────────────────────────────────────
  const subdomain = hostname.split(".")[0];
  const hasTenantSubdomain =
    subdomain && subdomain !== "www" && subdomain !== "localhost" && !subdomain.includes(":");

  const tenantId = hasTenantSubdomain ? await resolveTenantId(subdomain) : null;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = pathname === "/login" || pathname.startsWith("/auth/");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  if (tenantId) requestHeaders.set("x-tenant-id", tenantId);

  // ─── Supabase session refresh + auth checks (only on auth-sensitive paths) ─
  if (isProtectedRoute || isAuthRoute) {
    const { supabase, applyCookiesTo } = createSupabaseProxyClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (isProtectedRoute) {
      if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      const userTenantId = (user.app_metadata as { tenantId?: string })?.tenantId;
      if (tenantId && userTenantId !== tenantId) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/login?error=tenant_mismatch", request.url));
      }
    }

    if (pathname === "/login" && user) {
      const userTenantId = (user.app_metadata as { tenantId?: string })?.tenantId;
      if (!tenantId || userTenantId === tenantId) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }

    const response = applyCookiesTo(
      NextResponse.next({ request: { headers: requestHeaders } }),
    );
    return applySecurityHeaders(response, nonce);
  }

  // ─── Storefront / public paths: skip Supabase roundtrip ───────────────────
  return applySecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    nonce,
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
