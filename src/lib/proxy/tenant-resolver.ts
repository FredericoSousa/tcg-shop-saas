import { container } from "../infrastructure/container";
import { GetTenantUseCase } from "../application/use-cases/tenant/get-tenant.use-case";
import { TOKENS } from "../infrastructure/tokens";
import type { ICacheService } from "../infrastructure/cache/cache-service";
import { logger } from "../logger";

const TENANT_CACHE_TTL = 60;

export function extractSubdomain(hostname: string): string | null {
  const subdomain = hostname.split(".")[0];
  if (!subdomain) return null;
  if (subdomain === "www" || subdomain === "localhost") return null;
  if (subdomain.includes(":")) return null;
  return subdomain;
}

export async function resolveTenantId(slug: string): Promise<string | null> {
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
