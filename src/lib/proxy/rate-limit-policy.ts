import type { RateLimitConfig } from "../rate-limiter";

/**
 * Rate limit tiers applied in the proxy. More sensitive endpoints get
 * tighter buckets so brute-force / abuse attempts are contained before
 * reaching application code.
 */
const POLICIES: ReadonlyArray<{ match: (pathname: string, method: string) => boolean; config: RateLimitConfig; bucket: string }> = [
  {
    match: (p) => p.startsWith("/api/auth/") || p === "/login",
    config: { limit: 10, windowSeconds: 60 },
    bucket: "auth",
  },
  {
    match: (p) => p.startsWith("/api/checkout"),
    config: { limit: 15, windowSeconds: 60 },
    bucket: "checkout",
  },
  {
    match: (p) => p.startsWith("/api/"),
    config: { limit: 60, windowSeconds: 60 },
    bucket: "api",
  },
];

export interface RateLimitDecision {
  shouldLimit: boolean;
  bucket: string;
  config: RateLimitConfig;
}

export function selectRateLimitPolicy(pathname: string, method: string): RateLimitDecision | null {
  const policy = POLICIES.find((p) => p.match(pathname, method));
  if (!policy) return null;
  return { shouldLimit: true, bucket: policy.bucket, config: policy.config };
}
