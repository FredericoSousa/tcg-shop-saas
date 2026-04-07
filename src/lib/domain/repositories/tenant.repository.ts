import { Tenant, User } from "../entities/tenant";

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  update(id: string, data: Partial<Tenant>): Promise<Tenant>;
}

export interface IUserRepository {
  findById(id: string, tenantId: string): Promise<User | null>;
  findByUsername(username: string, tenantId: string): Promise<User | null>;
  findAll(tenantId: string): Promise<User[]>;
  save(user: User): Promise<User>;
  update(id: string, tenantId: string, data: Partial<User>): Promise<User>;
  delete(id: string, tenantId: string): Promise<void>;
}
