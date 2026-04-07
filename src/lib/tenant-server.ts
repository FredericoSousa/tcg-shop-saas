import { getSession } from "./auth";
import { getTenantById } from "./services/tenant.service";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

  return getTenantById(tenantId);
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

  const tenant = await getTenantById(tenantId);

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

  const tenant = await getTenantById(tenantId);

  if (!tenant) {
    return null;
  }

  return { session, tenant };
}
