import { injectable } from "tsyringe";
import { BasePrismaRepository } from "./base-prisma.repository";
import {
  ITenantRepository,
  ListTenantsOptions,
  ListTenantsResult,
  CreateTenantInput,
} from "@/lib/domain/repositories/tenant.repository";
import { Tenant as DomainTenant } from "@/lib/domain/entities/tenant";
import { Tenant as PrismaTenant, Prisma } from "@prisma/client";

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
    try {
      const updated = await this.prisma.tenant.update({
        where: { id },
        data,
      });
      return this.mapToDomain(updated);
    } catch (error) {
      this.mapPrismaError(error);
    }
  }

  async list(options: ListTenantsOptions): Promise<ListTenantsResult> {
    const { page, limit, search, active } = options;
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);

    const where: Prisma.TenantWhereInput = {};
    if (typeof active === "boolean") where.active = active;
    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { slug: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      items: items.map((t) => this.mapToDomain(t)),
      total,
    };
  }

  async create(input: CreateTenantInput): Promise<DomainTenant> {
    try {
      const created = await this.prisma.tenant.create({
        data: {
          slug: input.slug,
          name: input.name,
          email: input.email ?? null,
        },
      });
      return this.mapToDomain(created);
    } catch (error) {
      this.mapPrismaError(error);
    }
  }
}
