import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { ITenantRepository, IUserRepository } from "@/lib/domain/repositories/tenant.repository";
import { Tenant, User, UserRole } from "@/lib/domain/entities/tenant";
import { hashPassword } from "@/lib/auth";
import { getTenantId } from "../../tenant-context";
import { IUseCase } from "./use-case.interface";

@injectable()
export class UpdateSettingsUseCase implements IUseCase<{ id: string; data: Partial<Tenant> }, Tenant> {
  constructor(@inject(TOKENS.TenantRepository) private tenantRepo: ITenantRepository) {}

  async execute(request: { id: string; data: Partial<Tenant> }): Promise<Tenant> {
    const { id, data } = request;
    const allowedFields: (keyof Tenant)[] = [
      "name", "logoUrl", "faviconUrl", "description", "address", 
      "phone", "email", "instagram", "whatsapp", "facebook", "twitter"
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field as string] = data[field];
      }
    }

    return this.tenantRepo.update(id, updateData as Partial<Tenant>);
  }
}

@injectable()
export class ListUsersUseCase implements IUseCase<void, Partial<User>[]> {
  constructor(@inject(TOKENS.UserRepository) private userRepo: IUserRepository) {}

  async execute(): Promise<Partial<User>[]> {
    const users = await this.userRepo.findAll();
    return users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt,
    }));
  }
}

export interface SaveUserRequest {
  id?: string;
  username: string;
  password?: string;
  role?: UserRole;
}

@injectable()
export class SaveUserUseCase implements IUseCase<SaveUserRequest, Partial<User>> {
  constructor(@inject(TOKENS.UserRepository) private userRepo: IUserRepository) {}

  async execute(request: SaveUserRequest): Promise<Partial<User>> {
    const { id, username, password, role } = request;

    if (id) {
      const updateData: Partial<User> = { username, role };
      if (password) {
        updateData.passwordHash = await hashPassword(password);
      }
      const updated = await this.userRepo.update(id, updateData);
      return { id: updated.id, username: updated.username, role: updated.role };
    }

    if (!password) throw new Error("Senha é obrigatória para novos usuários.");

    const existing = await this.userRepo.findByUsername(username);
    if (existing) throw new Error("Usuário já existe.");

    const user = await this.userRepo.save({
      id: "",
      username,
      passwordHash: await hashPassword(password),
      role: role || "USER",
      tenantId: getTenantId()!,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { id: user.id, username: user.username, role: user.role };
  }
}
