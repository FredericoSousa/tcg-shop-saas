import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export interface CachePolicy {
  /** seconds the CDN may serve the cached copy without revalidating */
  sMaxAge: number;
  /** seconds the CDN may continue serving stale while revalidating */
  staleWhileRevalidate?: number;
}

export const CACHE_POLICIES = {
  /** 5 minutes shared cache, 1 minute swr — for slow-moving catalog data. */
  storefrontCatalog: { sMaxAge: 300, staleWhileRevalidate: 60 } as CachePolicy,
  /** 30 seconds for live-search; the user expects near-real-time results. */
  storefrontSearch: { sMaxAge: 30, staleWhileRevalidate: 30 } as CachePolicy,
} as const;

function formatCacheControl(policy: CachePolicy): string {
  const parts = ["public", `s-maxage=${policy.sMaxAge}`];
  if (policy.staleWhileRevalidate) {
    parts.push(`stale-while-revalidate=${policy.staleWhileRevalidate}`);
  }
  return parts.join(", ");
}

function computeETag(body: string): string {
  // Quoted weak ETag — `W/` allows tiny payload differences (timestamps,
  // log nonces) to still match if the semantic content is the same.
  return `W/"${createHash("sha1").update(body).digest("hex").slice(0, 16)}"`;
}

/**
 * Wraps a JSON payload with `Cache-Control` + a content-derived `ETag`,
 * and returns 304 Not Modified when the client sends a matching
 * `If-None-Match`. Fits read endpoints whose response is a pure
 * function of the request — anything tenant-scoped works because the
 * key is the URL+headers from the CDN's perspective.
 */
export function jsonWithCache<T>(
  request: NextRequest,
  body: T,
  policy: CachePolicy,
): NextResponse {
  const serialized = JSON.stringify(body);
  const etag = computeETag(serialized);

  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": formatCacheControl(policy),
      },
    });
  }

  return new NextResponse(serialized, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ETag: etag,
      "Cache-Control": formatCacheControl(policy),
      Vary: "x-tenant-id, accept-encoding",
    },
  });
}
