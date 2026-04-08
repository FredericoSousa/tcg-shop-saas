import { injectable } from "tsyringe";
import { BasePrismaRepository } from "./base-prisma.repository";
import { ITenantRepository, IUserRepository } from "@/lib/domain/repositories/tenant.repository";
import { Tenant as DomainTenant, User as DomainUser, UserRole } from "@/lib/domain/entities/tenant";
import { Tenant as PrismaTenant, User as PrismaUser } from "@prisma/client";

@injectable()
export class PrismaTenantRepository extends BasePrismaRepository implements ITenantRepository {
  private mapToDomain(item: PrismaTenant): DomainTenant {
    return { ...item };
  }

  async findById(id: string): Promise<DomainTenant | null> {
    const item = await this.prisma.tenant.findUnique({ where: { id } });
    return item ? this.mapToDomain(item) : null;
  }

  async findBySlug(slug: string): Promise<DomainTenant | null> {
    const item = await this.prisma.tenant.findUnique({ where: { slug } });
    return item ? this.mapToDomain(item) : null;
  }

  async update(id: string, data: Partial<DomainTenant>): Promise<DomainTenant> {
    const updated = await this.prisma.tenant.update({
      where: { id },
      data,
    });
    return this.mapToDomain(updated);
  }
}

@injectable()
export class PrismaUserRepository extends BasePrismaRepository implements IUserRepository {
  private mapToDomain(item: PrismaUser): DomainUser {
    return { 
      ...item,
      role: item.role as UserRole
    };
  }

  async findById(id: string): Promise<DomainUser | null> {
    const item = await this.prisma.user.findFirst({ where: { id } });
    return item ? this.mapToDomain(item) : null;
  }

  async findByUsername(username: string): Promise<DomainUser | null> {
    const item = await this.prisma.user.findFirst({
      where: { username }
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findAll(): Promise<DomainUser[]> {
    const items = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });
    return items.map(this.mapToDomain.bind(this));
  }

  async save(user: DomainUser): Promise<DomainUser> {
    const saved = await this.prisma.user.create({
      data: {
        username: user.username,
        passwordHash: user.passwordHash,
        role: user.role,
      } as any // eslint-disable-line @typescript-eslint/no-explicit-any
    });
    return this.mapToDomain(saved);
  }

  async update(id: string, data: Partial<DomainUser>): Promise<DomainUser> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    });
    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
