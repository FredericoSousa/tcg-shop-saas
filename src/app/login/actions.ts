"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserTenantId } from "@/lib/supabase/user-metadata";
import { logger } from "@/lib/logger";

export interface LoginActionResult {
  success: boolean;
  message?: string;
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

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    logger.warn("Login failed", {
      action: "login_with_password",
      email,
      error: error?.message,
    });
    return { success: false, message: "Email ou senha inválidos." };
  }

  if (getUserTenantId(data.user) !== tenantId) {
    await supabase.auth.signOut();
    return { success: false, message: "Usuário não pertence a esta loja." };
  }

  redirect("/admin");
}
