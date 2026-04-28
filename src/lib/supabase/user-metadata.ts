import type { User } from "@supabase/supabase-js";

export type UserRole = "ADMIN" | "USER";

export interface AppMetadata {
  tenantId?: string;
  role?: UserRole;
}

/**
 * Safely read the app_metadata payload we attach to Supabase users.
 * Returns an empty object if the shape is unexpected, so callers can
 * destructure without runtime surprises.
 */
export function getAppMetadata(user: Pick<User, "app_metadata"> | null | undefined): AppMetadata {
  const raw = user?.app_metadata;
  if (!raw || typeof raw !== "object") return {};
  const { tenantId, role } = raw as Record<string, unknown>;
  return {
    tenantId: typeof tenantId === "string" ? tenantId : undefined,
    role: role === "ADMIN" || role === "USER" ? role : undefined,
  };
}

export function getUserTenantId(user: Pick<User, "app_metadata"> | null | undefined): string | undefined {
  return getAppMetadata(user).tenantId;
}
