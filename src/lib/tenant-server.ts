import "reflect-metadata";
import { container } from "./infrastructure/container";
import { GetTenantUseCase } from "./application/use-cases/get-tenant.use-case";
import { getSession, type SessionData } from "./auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { runWithTenant } from "./tenant-context";
import type { Tenant } from "./domain/entities/tenant";

/**
 * Gets the current tenant from the x-tenant-id header.
 * Should be used in Server Components or API Routes.
 */
export async function getTenant() {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return null;
  }

  const getTenantUseCase = container.resolve(GetTenantUseCase);
  return getTenantUseCase.execute({ id: tenantId });
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

  const getTenantUseCase = container.resolve(GetTenantUseCase);
  const tenant = await getTenantUseCase.execute({ id: tenantId });

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

  const getTenantUseCase = container.resolve(GetTenantUseCase);
  const tenant = await getTenantUseCase.execute({ id: tenantId });

  if (!tenant) {
    return null;
  }

  return { session, tenant };
}

/**
 * Wrapper for API routes and Server Actions to ensure tenant context is set.
 */
export async function withAdminApi<T>(
  handler: (context: { session: SessionData, tenant: Tenant }) => Promise<T>
): Promise<T | Response> {
  const context = await validateAdminApi();
  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runWithTenant(context.tenant.id, () => handler(context));
}
