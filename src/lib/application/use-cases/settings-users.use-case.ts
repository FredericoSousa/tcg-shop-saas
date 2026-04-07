import { ITenantRepository, IUserRepository } from "@/lib/domain/repositories/tenant.repository";
import { Tenant, User, UserRole } from "@/lib/domain/entities/tenant";
import { hashPassword } from "@/lib/auth";

export class UpdateSettingsUseCase {
  constructor(private tenantRepo: ITenantRepository) {}

  async execute(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const allowedFields: (keyof Tenant)[] = [
      "name", "logoUrl", "faviconUrl", "description", "address", 
      "phone", "email", "instagram", "whatsapp", "facebook", "twitter"
    ];

    const updateData: Partial<Tenant> = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        (updateData as any)[field] = data[field];
      }
    }

    return this.tenantRepo.update(id, updateData);
  }
}

export class ListUsersUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(tenantId: string): Promise<Partial<User>[]> {
    const users = await this.userRepo.findAll(tenantId);
    return users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt,
    }));
  }
}

interface SaveUserRequest {
  id?: string;
  tenantId: string;
  username: string;
  password?: string;
  role?: UserRole;
}

export class SaveUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(request: SaveUserRequest): Promise<Partial<User>> {
    const { id, tenantId, username, password, role } = request;

    if (id) {
      const updateData: Partial<User> = { username, role };
      if (password) {
        updateData.passwordHash = await hashPassword(password);
      }
      const updated = await this.userRepo.update(id, tenantId, updateData);
      return { id: updated.id, username: updated.username, role: updated.role };
    }

    if (!password) throw new Error("Senha é obrigatória para novos usuários.");

    const existing = await this.userRepo.findByUsername(username, tenantId);
    if (existing) throw new Error("Usuário já existe.");

    const user = await this.userRepo.save({
      id: "",
      username,
      passwordHash: await hashPassword(password),
      role: role || "USER",
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { id: user.id, username: user.username, role: user.role };
  }
}
