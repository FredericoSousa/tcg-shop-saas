import { injectable } from "tsyringe";
import { prisma } from "../../prisma";
import { ITenantRepository, IUserRepository } from "@/lib/domain/repositories/tenant.repository";
import { Tenant as DomainTenant, User as DomainUser, UserRole } from "@/lib/domain/entities/tenant";
import { Tenant as PrismaTenant, User as PrismaUser } from "@prisma/client";

@injectable()
export class PrismaTenantRepository implements ITenantRepository {
  private mapToDomain(item: PrismaTenant): DomainTenant {
    return { ...item };
  }

  async findById(id: string): Promise<DomainTenant | null> {
    const item = await prisma.tenant.findUnique({ where: { id } });
    return item ? this.mapToDomain(item) : null;
  }

  async findBySlug(slug: string): Promise<DomainTenant | null> {
    const item = await prisma.tenant.findUnique({ where: { slug } });
    return item ? this.mapToDomain(item) : null;
  }

  async update(id: string, data: Partial<DomainTenant>): Promise<DomainTenant> {
    const updated = await prisma.tenant.update({
      where: { id },
      data,
    });
    return this.mapToDomain(updated);
  }
}

@injectable()
export class PrismaUserRepository implements IUserRepository {
  private mapToDomain(item: PrismaUser): DomainUser {
    return { 
      ...item,
      role: item.role as UserRole
    };
  }

  async findById(id: string, tenantId: string): Promise<DomainUser | null> {
    const item = await prisma.user.findFirst({ where: { id, tenantId } });
    return item ? this.mapToDomain(item) : null;
  }

  async findByUsername(username: string, tenantId: string): Promise<DomainUser | null> {
    const item = await prisma.user.findUnique({
      where: { username_tenantId: { username, tenantId } }
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findAll(tenantId: string): Promise<DomainUser[]> {
    const items = await prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" }
    });
    return items.map(this.mapToDomain);
  }

  async save(user: DomainUser): Promise<DomainUser> {
    const saved = await prisma.user.create({
      data: {
        username: user.username,
        passwordHash: user.passwordHash,
        role: user.role,
        tenantId: user.tenantId,
      }
    });
    return this.mapToDomain(saved);
  }

  async update(id: string, tenantId: string, data: Partial<DomainUser>): Promise<DomainUser> {
    const updated = await prisma.user.update({
      where: { id, tenantId },
      data,
    });
    return this.mapToDomain(updated);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.user.delete({ where: { id, tenantId } });
  }
}
