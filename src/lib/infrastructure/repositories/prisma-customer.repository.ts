import { injectable } from "tsyringe";
import { createHash } from "node:crypto";
import { BasePrismaRepository } from "./base-prisma.repository";
import { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Customer as DomainCustomer, CustomerStats } from "@/lib/domain/entities/customer";
import { Prisma, Customer as PrismaCustomer } from "@prisma/client";

@injectable()
export class PrismaCustomerRepository extends BasePrismaRepository implements ICustomerRepository {
  private mapToDomain(item: PrismaCustomer): DomainCustomer {
    return {
      id: item.id,
      name: item.name,
      email: item.email,
      phoneNumber: item.phoneNumber,
      creditBalance: Number(item.creditBalance || 0),
      tenantId: item.tenantId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
    };
  }

  async findById(id: string): Promise<DomainCustomer | null> {
    const item = await this.prisma.customer.findFirst({
      where: { id },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<DomainCustomer | null> {
    const item = await this.prisma.customer.findFirst({
      where: { phoneNumber },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async save(customer: DomainCustomer): Promise<DomainCustomer> {
    const data: Prisma.CustomerUncheckedCreateInput = {
      name: customer.name,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      tenantId: customer.tenantId,
    };

    const saved = await this.prisma.customer.create({ data });
    return this.mapToDomain(saved);
  }

  async update(id: string, data: Partial<DomainCustomer>): Promise<DomainCustomer> {
    const updated = await this.prisma.customer.update({
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
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      items: items.map(this.mapToDomain.bind(this)),
      total,
    };
  }

  async getStats(id: string): Promise<CustomerStats> {
    const stats = await this.prisma.order.aggregate({
      where: { customerId: id },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    return {
      totalSpent: Number(stats._sum.totalAmount || 0),
      totalOrders: stats._count.id,
    };
  }

  async upsert(phoneNumber: string, data: { name?: string; email?: string }, tx?: unknown): Promise<DomainCustomer> {
    const tenantId = this.currentTenantId;
    const client = (tx as Prisma.TransactionClient) || this.prisma;
    const customer = await client.customer.upsert({
      where: { phoneNumber_tenantId: { phoneNumber, tenantId } },
      update: {
        name: data.name || undefined,
        email: data.email || undefined,
      },
      create: {
        name: data.name || "",
        phoneNumber,
        email: data.email || null,
        tenantId,
      },
    });
    return this.mapToDomain(customer);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateCreditBalance(id: string, amount: number, tx?: unknown): Promise<void> {
    const prismaClient = (tx as Prisma.TransactionClient) || this.prisma;
    await prismaClient.customer.update({
      where: { id },
      data: {
        creditBalance: { increment: new Prisma.Decimal(amount) },
      },
    });
  }

  async anonymise(id: string, tx?: unknown): Promise<void> {
    const prismaClient = (tx as Prisma.TransactionClient) || this.prisma;
    // The phoneNumber column is part of a unique key (phoneNumber,
    // tenantId). Replace it with a deterministic synthetic value
    // derived from the original id so re-running the operation
    // produces the same result and we don't collide with new
    // customers that re-use the original phone.
    const synthetic = `REMOVED-${createHash("sha256").update(id).digest("hex").slice(0, 16)}`;
    await prismaClient.customer.update({
      where: { id },
      data: {
        name: "[REMOVED]",
        email: null,
        phoneNumber: synthetic,
        deletedAt: new Date(),
      },
    });
  }

  async tryDebitCredit(id: string, amount: number, tx?: unknown): Promise<boolean> {
    if (amount <= 0) {
      throw new Error("tryDebitCredit requires a positive amount.");
    }
    const prismaClient = (tx as Prisma.TransactionClient) || this.prisma;
    const decimalAmount = new Prisma.Decimal(amount);

    // updateMany lets us pair the decrement with a balance check inside
    // a single SQL UPDATE, so concurrent debits cannot both succeed.
    const result = await prismaClient.customer.updateMany({
      where: { id, creditBalance: { gte: decimalAmount } },
      data: { creditBalance: { decrement: decimalAmount } },
    });

    return result.count === 1;
  }
}
