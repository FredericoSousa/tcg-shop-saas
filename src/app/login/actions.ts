"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserTenantId } from "@/lib/supabase/user-metadata";
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

export async function loginWithPassword(formData: FormData): Promise<LoginActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { success: false, message: "Email e senha são obrigatórios." };
  }

  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return { success: false, message: "Loja não identificada. Acesse por um subdomínio válido." };
  }

  const gate = await checkLoginGate(tenantId, email);
  if (gate.locked) {
    logger.warn("Login blocked by throttle", {
      action: "login_with_password",
      tenantId,
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
    const after = await recordLoginFailure(tenantId, email);
    logger.warn("Login failed", {
      action: "login_with_password",
      tenantId,
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

  if (getUserTenantId(data.user) !== tenantId) {
    await supabase.auth.signOut();
    // Wrong tenant counts as a failure — same as a wrong password from
    // the attacker's point of view, and prevents enumerating accounts
    // across stores.
    await recordLoginFailure(tenantId, email);
    return { success: false, message: "Usuário não pertence a esta loja." };
  }

  await clearLoginFailures(tenantId, email);
  redirect("/admin");
}
