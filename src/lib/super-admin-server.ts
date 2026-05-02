import "reflect-metadata";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { createSupabaseServerClient } from "./supabase/server";
import { getAppMetadata } from "./supabase/user-metadata";
import { runWithCorrelationId } from "./correlation-context";
import { withSpan } from "./observability/tracer";
import { ApiResponse } from "./infrastructure/http/api-response";
import { logger } from "./logger";
import {
  DomainError,
  EntityNotFoundError,
  ValidationError,
  BusinessRuleViolationError,
  ConflictError,
} from "./domain/errors/domain.error";

export interface SuperAdminSession {
  userId: string;
  email: string;
}

/**
 * Reads the Supabase session and confirms the user is a SUPER_ADMIN.
 * Unlike `getSession()` in tenant-server, no tenant binding is required —
 * super admins operate on the root domain at /internal.
 */
export async function getSuperAdminSession(): Promise<SuperAdminSession | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const meta = getAppMetadata(user);
    if (meta.role !== "SUPER_ADMIN") return null;

    return {
      userId: user.id,
      email: user.email ?? "",
    };
  } catch {
    return null;
  }
}

/**
 * Server Component / Page guard. Redirects to /login if the visitor is not
 * authenticated as a SUPER_ADMIN.
 */
export async function getSuperAdminContext(): Promise<{ session: SuperAdminSession }> {
  const session = await getSuperAdminSession();
  if (!session) {
    redirect("/login");
  }
  return { session };
}

function handleDomainError(error: DomainError): Response {
  if (error instanceof EntityNotFoundError) return ApiResponse.notFound(error.message, error.code);
  if (error instanceof ValidationError) return ApiResponse.badRequest(error.message, error.code, error.details);
  if (error instanceof ConflictError)
    return ApiResponse.json({ success: false, message: error.message, error: { code: error.code } }, 409);
  if (error instanceof BusinessRuleViolationError)
    return ApiResponse.json({ success: false, message: error.message, error: { code: error.code } }, 422);
  return ApiResponse.serverError(error.message, error.code);
}

/**
 * API route wrapper. Returns 401 if the caller is not a SUPER_ADMIN; otherwise
 * runs the handler with correlation/tracing wired in (no tenant context — the
 * super-admin panel acts across tenants).
 */
export async function withSuperAdminApi<T>(
  handler: (context: { session: SuperAdminSession }) => Promise<T>,
): Promise<T | Response> {
  const session = await getSuperAdminSession();
  if (!session) return ApiResponse.unauthorized();

  const headersList = await headers();
  const correlationId = headersList.get("x-correlation-id") ?? undefined;

  try {
    return await withSpan(
      "super-admin.handler",
      { "user.id": session.userId },
      () => runWithCorrelationId(() => handler({ session }), correlationId),
    );
  } catch (error) {
    if (error instanceof DomainError) {
      logger.warn(`Super-admin domain error: ${error.message}`, { action: error.code, userId: session.userId });
      return handleDomainError(error);
    }
    if (error instanceof ZodError) {
      const details = error.issues.map((e) => `${e.path.map(String).join(".")}: ${e.message}`);
      return ApiResponse.badRequest("Dados inválidos", "VALIDATION_ERROR", details);
    }
    logger.error("Unhandled super-admin API error", error as Error, { userId: session.userId });
    return ApiResponse.serverError();
  }
}
