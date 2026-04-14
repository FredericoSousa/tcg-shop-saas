import { injectable } from "tsyringe";
import { BasePrismaRepository } from "./base-prisma.repository";
import { ITenantRepository } from "@/lib/domain/repositories/tenant.repository";
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

