import "reflect-metadata";
import { container } from "./infrastructure/container";
import { GetTenantUseCase } from "./application/use-cases/tenant/get-tenant.use-case";
import { headers } from "next/headers";
import { cacheLife, cacheTag } from "next/cache";
import { redirect } from "next/navigation";
import { runWithTenant, enterTenantContext } from "./tenant-context";
import { runWithCorrelationId } from "./correlation-context";
import type { Tenant } from "./domain/entities/tenant";
import {
  DomainError,
  EntityNotFoundError,
  ValidationError,
  BusinessRuleViolationError,
  InsufficientStockError,
  InsufficientFundsError,
  ConflictError,
} from "./domain/errors/domain.error";
import { ApiResponse } from "./infrastructure/http/api-response";
import { logger } from "./logger";
import { ZodError } from "zod";
import { createSupabaseServerClient } from "./supabase/server";
import { getAppMetadata } from "./supabase/user-metadata";

export interface SessionData {
  userId: string;
  email: string;
  tenantId: string;
  role: "ADMIN" | "USER";
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const meta = getAppMetadata(user);
    if (!meta.tenantId || !meta.role) return null;

    return {
      userId: user.id,
      email: user.email ?? "",
      tenantId: meta.tenantId,
      role: meta.role,
    };
  } catch {
    return null;
  }
}

/**
 * Cached wrapper for resolving tenant. Uses Next 16's `'use cache'`
 * directive (Cache Components). Tagged so an admin updating their
 * tenant settings can `revalidateTag(`tenant-${id}`)` to bust this.
 */
async function getCachedTenant(id: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("tenant", `tenant-${id}`);
  const getTenantUseCase = container.resolve(GetTenantUseCase);
  return getTenantUseCase.execute({ id });
}

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

    const tenant = await getCachedTenant(tenantId);
    if (tenant) enterTenantContext(tenant.id);
    return tenant;
  } catch {
    return null;
  }
}

/**
 * Reads x-tenant-id from the incoming request headers and enters the tenant
 * AsyncLocalStorage context for the current async branch. Idempotent and cheap
 * — call at the top of any Server Component that queries tenant-aware data
 * when the layout's context doesn't propagate (RSC renders children in parallel).
 */
export async function ensureTenantContext(): Promise<string | null> {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  if (tenantId) enterTenantContext(tenantId);
  return tenantId;
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

  enterTenantContext(tenant.id);
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

  enterTenantContext(tenant.id);
  return { session, tenant };
}

function handleDomainError(error: DomainError): Response {
  if (error instanceof EntityNotFoundError) {
    return ApiResponse.notFound(error.message, error.code);
  }
  if (error instanceof ValidationError) {
    return ApiResponse.badRequest(error.message, error.code, error.details);
  }
  if (error instanceof InsufficientFundsError) {
    return ApiResponse.badRequest(error.message, error.code);
  }
  if (error instanceof InsufficientStockError) {
    return ApiResponse.json({ success: false, message: error.message, error: { code: error.code } }, 409);
  }
  if (error instanceof BusinessRuleViolationError) {
    return ApiResponse.json({ success: false, message: error.message, error: { code: error.code } }, 422);
  }
  if (error instanceof ConflictError) {
    return ApiResponse.json({ success: false, message: error.message, error: { code: error.code } }, 409);
  }
  return ApiResponse.serverError(error.message, error.code);
}

// Rate limiting is enforced at the proxy/middleware layer (see
// `src/lib/proxy/rate-limit-policy.ts`). Don't redo it here — would
// double the Redis ops per request.

export async function withAdminApi<T>(
  handler: (context: { session: SessionData, tenant: Tenant }) => Promise<T>
): Promise<T | Response> {
  const context = await validateAdminApi();
  if (!context) {
    return ApiResponse.unauthorized();
  }

  const headersList = await headers();
  const correlationId = headersList.get("x-correlation-id") ?? undefined;

  try {
    return await runWithCorrelationId(
      () => runWithTenant(context.tenant.id, () => handler(context)),
      correlationId,
    );
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

export async function withTenantApi<T>(
  handler: (context: { tenant: Tenant }) => Promise<T>
): Promise<T | Response> {
  const tenant = await getTenant();

  if (!tenant) {
    return ApiResponse.unauthorized("Tenant ID não identificado");
  }

  const headersList = await headers();
  const correlationId = headersList.get("x-correlation-id") ?? undefined;

  try {
    return await runWithCorrelationId(
      () => runWithTenant(tenant.id, () => handler({ tenant })),
      correlationId,
    );
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
