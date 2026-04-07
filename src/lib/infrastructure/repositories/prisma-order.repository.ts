import { prisma } from "../../prisma";
import { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import { Order as DomainOrder, OrderStatus, OrderSource } from "@/lib/domain/entities/order";
import { Prisma } from "@prisma/client";

export class PrismaOrderRepository implements IOrderRepository {
  private mapToDomain(item: any): DomainOrder {
    return {
      id: item.id,
      tenantId: item.tenantId,
      customerId: item.customerId,
      totalAmount: Number(item.totalAmount),
      status: item.status as OrderStatus,
      source: item.source as OrderSource,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      customer: item.customer ? {
        name: item.customer.name,
        phoneNumber: item.customer.phoneNumber,
      } : undefined,
      items: item.items?.map((oi: any) => ({
        id: oi.id,
        orderId: oi.orderId,
        inventoryItemId: oi.inventoryItemId,
        productId: oi.productId,
        quantity: oi.quantity,
        priceAtPurchase: Number(oi.priceAtPurchase),
      })),
    };
  }

  async findById(id: string, tenantId: string): Promise<DomainOrder | null> {
    const item = await prisma.order.findFirst({
      where: { id, tenantId },
      include: { 
        customer: true,
        items: {
          include: { 
            inventoryItem: { include: { cardTemplate: true } },
            product: true 
          }
        }
      },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async save(order: DomainOrder, items: any[]): Promise<DomainOrder> {
    const saved = await prisma.order.create({
      data: {
        tenantId: order.tenantId,
        customerId: order.customerId,
        totalAmount: new Prisma.Decimal(order.totalAmount),
        status: order.status,
        source: order.source,
        items: {
          create: items.map(item => ({
            inventoryItemId: item.inventoryItemId,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: new Prisma.Decimal(item.priceAtPurchase),
          })),
        },
      },
      include: { customer: true, items: true },
    });

    return this.mapToDomain(saved);
  }

  async updateStatus(id: string, tenantId: string, status: OrderStatus): Promise<void> {
    await prisma.order.update({
      where: { id, tenantId },
      data: { status },
    });
  }

  async findPaginated(
    tenantId: string,
    page: number,
    limit: number,
    filters?: {
      status?: OrderStatus | "all";
      source?: OrderSource | "all";
      search?: string;
      customerPhone?: string;
    }
  ): Promise<{ items: DomainOrder[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {
      tenantId,
      ...(filters?.status && filters.status !== "all" ? { status: filters.status as any } : {}),
      ...(filters?.source && filters.source !== "all" ? { source: filters.source as any } : {}),
      ...(filters?.customerPhone ? { customer: { phoneNumber: filters.customerPhone } } : {}),
      ...(filters?.search ? {
        OR: [
          { customer: { name: { contains: filters.search, mode: "insensitive" } } },
          { customer: { phoneNumber: { contains: filters.search, mode: "insensitive" } } },
        ],
      } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { customer: true, items: true },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      items: items.map(this.mapToDomain),
      total,
    };
  }
}
