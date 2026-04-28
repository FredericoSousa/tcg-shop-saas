import { injectable } from "tsyringe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTenantId } from "../../../tenant-context";
import { IUseCase } from "../use-case.interface";
import { saveUserSchema } from "@/lib/validation/schemas";

export type UserRole = "ADMIN" | "USER";

export interface SaveUserRequest {
  id?: string;
  email: string;
  password?: string;
  role?: UserRole;
}

export interface SaveUserResponse {
  id: string;
  email: string;
  role: UserRole;
}

@injectable()
export class SaveUserUseCase implements IUseCase<SaveUserRequest, SaveUserResponse> {
  async execute(request: SaveUserRequest): Promise<SaveUserResponse> {
    const { id, email, password, role } = saveUserSchema.parse(request);
    const tenantId = getTenantId()!;

    if (id) {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
        email,
        ...(password ? { password } : {}),
        app_metadata: { tenantId, role: role ?? "USER" },
      });
      if (error || !data.user) throw new Error(error?.message ?? "Falha ao atualizar usuário.");
      return {
        id: data.user.id,
        email: data.user.email!,
        role: (data.user.app_metadata?.role ?? "USER") as UserRole,
      };
    }

    if (!password) throw new Error("Senha é obrigatória para novos usuários.");

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { tenantId, role: role ?? "USER" },
    });
    if (error || !data.user) throw new Error(error?.message ?? "Falha ao criar usuário.");

    return {
      id: data.user.id,
      email: data.user.email!,
      role: (data.user.app_metadata?.role ?? "USER") as UserRole,
    };
  }
}
