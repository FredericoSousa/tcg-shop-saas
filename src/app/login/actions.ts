"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppMetadata, getUserTenantId } from "@/lib/supabase/user-metadata";
import { logger } from "@/lib/logger";
import {
  checkLoginGate,
  clearLoginFailures,
  recordLoginFailure,
} from "@/lib/auth/login-throttle";

export interface LoginActionResult {
  success: boolean;
  message?: string;
  retryAfterSeconds?: number;
}

/**
 * Throttle bucket used when the login form is served on the root domain
 * (super-admin path). Keeps the per-account throttle keyed by a stable
 * value instead of a missing tenantId.
 */
const ROOT_LOGIN_BUCKET = "__root__";

export async function loginWithPassword(formData: FormData): Promise<LoginActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { success: false, message: "Email e senha são obrigatórios." };
  }

  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  const throttleKey = tenantId ?? ROOT_LOGIN_BUCKET;

  const gate = await checkLoginGate(throttleKey, email);
  if (gate.locked) {
    logger.warn("Login blocked by throttle", {
      action: "login_with_password",
      tenantId: tenantId ?? undefined,
      email,
      retryAfterSeconds: gate.retryAfterSeconds,
    });
    const minutes = Math.ceil(gate.retryAfterSeconds / 60);
    return {
      success: false,
      message: `Muitas tentativas falhas. Tente novamente em ${minutes} minuto(s).`,
      retryAfterSeconds: gate.retryAfterSeconds,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    const after = await recordLoginFailure(throttleKey, email);
    logger.warn("Login failed", {
      action: "login_with_password",
      tenantId: tenantId ?? undefined,
      email,
      error: error?.message,
      failuresInWindow: after.failures,
      lockedAfter: after.locked,
    });
    if (after.locked) {
      const minutes = Math.ceil(after.retryAfterSeconds / 60);
      return {
        success: false,
        message: `Muitas tentativas falhas. Conta bloqueada por ${minutes} minuto(s).`,
        retryAfterSeconds: after.retryAfterSeconds,
      };
    }
    return { success: false, message: "Email ou senha inválidos." };
  }

  const meta = getAppMetadata(data.user);

  // Root-domain login: only super admins may pass.
  if (!tenantId) {
    if (meta.role !== "SUPER_ADMIN") {
      await supabase.auth.signOut();
      await recordLoginFailure(throttleKey, email);
      return { success: false, message: "Credenciais inválidas para esta área." };
    }
    await clearLoginFailures(throttleKey, email);
    redirect("/internal");
  }

  // Tenant-domain login: user must belong to this tenant.
  if (getUserTenantId(data.user) !== tenantId) {
    await supabase.auth.signOut();
    // Wrong tenant counts as a failure — same as a wrong password from
    // the attacker's point of view, and prevents enumerating accounts
    // across stores.
    await recordLoginFailure(throttleKey, email);
    return { success: false, message: "Usuário não pertence a esta loja." };
  }

  await clearLoginFailures(throttleKey, email);
  redirect("/admin");
}
