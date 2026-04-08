/* eslint-disable @typescript-eslint/no-explicit-any */
import { injectable } from "tsyringe";
import { prisma } from "../../prisma";
import { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import { Order as DomainOrder, OrderStatus, OrderSource, OrderItem as DomainOrderItem } from "@/lib/domain/entities/order";
import { Prisma, Order as PrismaOrder, OrderItem as PrismaOrderItem, Customer as PrismaCustomer } from "@prisma/client";

type PrismaOrderWithRelations = PrismaOrder & {
  items?: PrismaOrderItem[];
  customer?: PrismaCustomer | null;
};

@injectable()
export class PrismaOrderRepository implements IOrderRepository {
  private mapToDomain(item: PrismaOrderWithRelations): DomainOrder {
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
      items: item.items?.map((oi: PrismaOrderItem) => ({
        id: oi.id,
        orderId: oi.orderId,
        inventoryItemId: oi.inventoryItemId,
        productId: oi.productId,
        quantity: oi.quantity,
        priceAtPurchase: Number(oi.priceAtPurchase),
      })),
    };
  }

  async findById(id: string): Promise<DomainOrder | null> {
    const item = await prisma.order.findFirst({
      where: { id },
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

  async save(order: DomainOrder, items: Omit<DomainOrderItem, "id" | "orderId">[]): Promise<DomainOrder> {
    const saved = await prisma.order.create({
      // RLS takes over filtering.
      data: {
        customerId: order.customerId,
        totalAmount: new Prisma.Decimal(order.totalAmount),
        status: order.status,
        source: order.source,
        items: {
          create: items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: new Prisma.Decimal(item.priceAtPurchase),
          })),
        },
      } as any,
      include: { customer: true, items: true },
    });

    return this.mapToDomain(saved);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: {
      status?: OrderStatus | "all";
      source?: OrderSource | "all";
      search?: string;
      customerPhone?: string;
      customerId?: string;
    }
  ): Promise<{ items: DomainOrder[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {
      ...(filters?.status && filters.status !== "all" ? { status: filters.status as OrderStatus } : {}),
      ...(filters?.source && filters.source !== "all" ? { source: filters.source as OrderSource } : {}),
      ...(filters?.customerPhone ? { customer: { phoneNumber: filters.customerPhone } } : {}),
      ...(filters?.customerId ? { customerId: filters.customerId } : {}),
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
      items: items.map(this.mapToDomain.bind(this)),
      total,
    };
  }

  async findPendingPOSOrder(customerId: string): Promise<DomainOrder | null> {
    const item = await prisma.order.findFirst({
      where: {
        customerId,
        status: "PENDING",
        source: "POS",
      },
      include: { items: true, customer: true },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async appendToOrder(orderId: string, items: { productId: string; quantity: number; priceAtPurchase: number }[], totalAmountIncrement: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 1. Update order total
      await tx.order.update({
        where: { id: orderId },
        data: { totalAmount: { increment: new Prisma.Decimal(totalAmountIncrement) } },
      });

      // 2. Add/Update items
      for (const item of items) {
        const existingItem = await tx.orderItem.findFirst({
          where: { orderId, productId: item.productId },
        });

        if (existingItem) {
          await tx.orderItem.update({
            where: { id: existingItem.id },
            data: { quantity: { increment: item.quantity } },
          });
        } else {
          await tx.orderItem.create({
            data: {
              orderId,
              productId: item.productId,
              quantity: item.quantity,
              priceAtPurchase: new Prisma.Decimal(item.priceAtPurchase),
            },
          });
        }
      }
    });
  }
}
