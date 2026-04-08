/* eslint-disable @typescript-eslint/no-explicit-any */
import { injectable } from "tsyringe";
import { prisma } from "../../prisma";
import { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Customer as DomainCustomer, CustomerStats } from "@/lib/domain/entities/customer";
import { Prisma, Customer as PrismaCustomer } from "@prisma/client";
import { getTenantId } from "../../tenant-context";

@injectable()
export class PrismaCustomerRepository implements ICustomerRepository {
  private mapToDomain(item: PrismaCustomer): DomainCustomer {
    return {
      id: item.id,
      name: item.name,
      email: item.email,
      phoneNumber: item.phoneNumber,
      tenantId: item.tenantId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
    };
  }

  async findById(id: string): Promise<DomainCustomer | null> {
    const item = await prisma.customer.findFirst({
      where: { id },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<DomainCustomer | null> {
    const item = await prisma.customer.findFirst({
      where: { phoneNumber },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async save(customer: DomainCustomer): Promise<DomainCustomer> {
    const data = {
      name: customer.name,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const saved = await prisma.customer.create({ data: data as any });
    return this.mapToDomain(saved);
  }

  async update(id: string, data: Partial<DomainCustomer>): Promise<DomainCustomer> {
    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        deletedAt: data.deletedAt,
      },
    });
    return this.mapToDomain(updated);
  }

  async findPaginated(
    page: number,
    limit: number,
    options?: { search?: string; includeDeleted?: boolean }
  ): Promise<{ items: DomainCustomer[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.CustomerWhereInput = {
      ...(options?.includeDeleted ? {} : { deletedAt: null }),
      ...(options?.search ? {
        OR: [
          { name: { contains: options.search, mode: "insensitive" } },
          { email: { contains: options.search, mode: "insensitive" } },
          { phoneNumber: { contains: options.search, mode: "insensitive" } },
        ],
      } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      items: items.map(this.mapToDomain),
      total,
    };
  }

  async getStats(id: string): Promise<CustomerStats> {
    const stats = await prisma.order.aggregate({
      where: { customerId: id },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    return {
      totalSpent: Number(stats._sum.totalAmount || 0),
      totalOrders: stats._count.id,
    };
  }

  async upsert(phoneNumber: string, data: { name?: string; email?: string }): Promise<DomainCustomer> {
    const tenantId = getTenantId()!;
    const customer = await prisma.customer.upsert({
      where: { phoneNumber_tenantId: { phoneNumber, tenantId } },
      update: {
        name: data.name || undefined,
        email: data.email || undefined,
      },
      create: {
        name: data.name || "",
        phoneNumber,
        email: data.email || null,
      // RLS takes over filtering.
      } as any,
    });
    return this.mapToDomain(customer);
  }
}
