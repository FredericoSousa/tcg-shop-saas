import "reflect-metadata";
import { container } from "./infrastructure/container";
import { GetTenantUseCase } from "./application/use-cases/get-tenant.use-case";
import { getSession, type SessionData } from "./auth";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { runWithTenant } from "./tenant-context";
import type { Tenant } from "./domain/entities/tenant";
import { DomainError, EntityNotFoundError, ValidationError, BusinessRuleViolationError } from "./domain/errors/domain.error";
import { ApiResponse } from "./infrastructure/http/api-response";
import { logger } from "./logger";
import { ZodError } from "zod";

/**
 * Cached wrapper for resolving tenant
 */
const getCachedTenant = (id: string) => {
  return unstable_cache(
    async () => {
      const getTenantUseCase = container.resolve(GetTenantUseCase);
      return getTenantUseCase.execute({ id });
    },
    [`tenant-${id}`],
    { revalidate: 3600, tags: ["tenant", `tenant-${id}`] }
  )();
};

/**
 * Gets the current tenant from the x-tenant-id header.
 * Should be used in Server Components or API Routes.
 */
export async function getTenant() {
  try {
    const headersList = await headers();
    const tenantId = headersList.get("x-tenant-id");

    if (!tenantId) {
      return null;
    }

    return getCachedTenant(tenantId);
  } catch {
    // If headers() is called during static generation, it may throw or return empty
    // We return null to allow the build to proceed with a default state if applicable
    return null;
  }
}

/**
 * Gets the current admin context (session + tenant).
 * Validates that the session belongs to the current tenant.
 * Should be used in Server Components. Redirects to /login if unauthorized.
 */
export async function getAdminContext() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId || session.tenantId !== tenantId || session.role !== "ADMIN") {
    redirect("/login");
  }

  const tenant = await getCachedTenant(tenantId);

  if (!tenant) {
    redirect("/login");
  }

  return { session, tenant };
}

/**
 * Validates the admin context for API routes.
 * Returns the context or null if unauthorized.
 */
export async function validateAdminApi() {
  const session = await getSession();
  
  if (!session || session.role !== "ADMIN") {
    return null;
  }

  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId || session.tenantId !== tenantId) {
    return null;
  }

  const tenant = await getCachedTenant(tenantId);

  if (!tenant) {
    return null;
  }

  return { session, tenant };
}

import { checkRateLimit } from "./rate-limiter";

/**
 * Maps DomainError subclasses to appropriate HTTP responses.
 */
function handleDomainError(error: DomainError): Response {
  if (error instanceof EntityNotFoundError) {
    return ApiResponse.notFound(error.message, error.code);
  }
  if (error instanceof ValidationError) {
    return ApiResponse.badRequest(error.message, error.code, error.details);
  }
  if (error instanceof BusinessRuleViolationError) {
    return ApiResponse.json({ success: false, message: error.message, error: { code: error.code } }, 422);
  }
  return ApiResponse.serverError(error.message, error.code);
}

/**
 * Applies rate limiting and returns a response if limited, or null if allowed.
 */
async function applyRateLimit(key: string, limit = 60, window = 60) {
  const result = checkRateLimit(key, { limit, windowSeconds: window });
  
  if (!result.allowed) {
    return new Response(JSON.stringify({
      success: false,
      message: "Muitas requisições. Tente novamente mais tarde.",
      error: { code: "TOO_MANY_REQUESTS" }
    }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetAt.toString(),
      }
    });
  }
  
  return null;
}

/**
 * Wrapper for API routes and Server Actions to ensure tenant context is set.
 * Provides centralized error handling: DomainErrors are mapped to appropriate
 * HTTP status codes, unknown errors return 500.
 */
export async function withAdminApi<T>(
  handler: (context: { session: SessionData, tenant: Tenant }) => Promise<T>
): Promise<T | Response> {
  const context = await validateAdminApi();
  if (!context) {
    return ApiResponse.unauthorized();
  }

  // Rate Limiting
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const rateLimitResponse = await applyRateLimit(`admin:${ip}:${context.tenant.id}`, 100, 60);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    return await runWithTenant(context.tenant.id, () => handler(context));
  } catch (error) {
    if (error instanceof DomainError) {
      logger.warn(`Domain error: ${error.message}`, { action: error.code, tenantId: context.tenant.id });
      return handleDomainError(error);
    }

    if (error instanceof ZodError) {
      const details = error.issues.map((e) => `${e.path.map(String).join(".")}: ${e.message}`);
      return ApiResponse.badRequest("Dados inválidos", "VALIDATION_ERROR", details);
    }

    logger.error("Unhandled API error", error as Error, { tenantId: context.tenant.id });
    return ApiResponse.serverError();
  }
}

/**
 * Wrapper for public/storefront API routes to ensure tenant context is set.
 */
export async function withTenantApi<T>(
  handler: (context: { tenant: Tenant }) => Promise<T>
): Promise<T | Response> {
  const tenant = await getTenant();
  
  if (!tenant) {
    return ApiResponse.unauthorized("Tenant ID não identificado");
  }

  // Rate Limiting
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const rateLimitResponse = await applyRateLimit(`tenant:${ip}:${tenant.id}`, 60, 60);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    return await runWithTenant(tenant.id, () => handler({ tenant }));
  } catch (error) {
    if (error instanceof DomainError) {
      logger.warn(`Domain error: ${error.message}`, { action: error.code, tenantId: tenant.id });
      return handleDomainError(error);
    }

    if (error instanceof ZodError) {
      const details = error.issues.map((e) => `${e.path.map(String).join(".")}: ${e.message}`);
      return ApiResponse.badRequest("Dados inválidos", "VALIDATION_ERROR", details);
    }

    logger.error("Unhandled API error", error as Error, { tenantId: tenant.id });
    return ApiResponse.serverError();
  }
}
