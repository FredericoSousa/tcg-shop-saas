import { injectable } from "tsyringe";
import { BasePrismaRepository } from "./base-prisma.repository";
import { IUserRepository } from "@/lib/domain/repositories/user.repository";
import { User as DomainUser, UserRole } from "@/lib/domain/entities/tenant";
import { User as PrismaUser } from "@prisma/client";

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

  async findPaginated(page: number, limit: number, search?: string): Promise<{ items: DomainUser[]; total: number }> {
    const skip = (page - 1) * limit;
    const where = search ? {
      username: { contains: search, mode: "insensitive" as const }
    } : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      items: items.map(this.mapToDomain.bind(this)),
      total
    };
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
