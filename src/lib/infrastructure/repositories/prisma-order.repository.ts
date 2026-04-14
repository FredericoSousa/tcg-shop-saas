import { injectable } from "tsyringe";
import { BasePrismaRepository } from "./base-prisma.repository";
import { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import { Order as DomainOrder, OrderStatus, OrderSource, OrderItem as DomainOrderItem, PaymentMethodType } from "@/lib/domain/entities/order";
import { Prisma, Order as PrismaOrder, OrderItem as PrismaOrderItem, Customer as PrismaCustomer } from "@prisma/client";

type PrismaOrderItemWithRelations = PrismaOrderItem & {
  product?: { name: string; imageUrl: string | null } | null;
  inventoryItem?: { 
    cardTemplate?: { imageUrl: string | null } | null 
  } | null;
};

type PrismaOrderWithRelations = PrismaOrder & {
  items?: PrismaOrderItemWithRelations[];
  payments?: { id: string; orderId: string; method: string; amount: Prisma.Decimal; createdAt: Date }[];
  customer?: PrismaCustomer | null;
};

@injectable()
export class PrismaOrderRepository extends BasePrismaRepository implements IOrderRepository {
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
      friendlyId: item.friendlyId,
      customer: item.customer ? {
        name: item.customer.name,
        phoneNumber: item.customer.phoneNumber,
      } : undefined,
      items: item.items?.map((oi: PrismaOrderItemWithRelations) => ({
        id: oi.id,
        orderId: oi.orderId,
        inventoryItemId: oi.inventoryItemId || undefined,
        productId: oi.productId || undefined,
        product: {
          name: oi.product?.name || "Produto",
          imageUrl: oi.product?.imageUrl || null,
        },
        quantity: oi.quantity,
        priceAtPurchase: Number(oi.priceAtPurchase),
      })),
      payments: item.payments?.map((p) => ({
        id: p.id,
        orderId: p.orderId,
        method: p.method as PaymentMethodType,
        amount: Number(p.amount),
        createdAt: p.createdAt,
      })),
    };
  }

  async findById(id: string): Promise<DomainOrder | null> {
    const item = await this.prisma.order.findFirst({
      where: { id },
      include: {
        customer: true,
        payments: true,
        items: {
          include: {
            inventoryItem: { include: { cardTemplate: true } },
            product: true
          }
        }
      },
    });
    return item ? this.mapToDomain(item as PrismaOrderWithRelations) : null;
  }

  async save(order: DomainOrder, items: Omit<DomainOrderItem, "id" | "orderId">[], tx?: unknown): Promise<DomainOrder> {
    const client = (tx as Prisma.TransactionClient) || this.prisma;
    const saved = await client.order.create({
      data: {
        customerId: order.customerId,
        tenantId: order.tenantId,
        totalAmount: new Prisma.Decimal(order.totalAmount),
        status: order.status,
        source: order.source,
        friendlyId: order.friendlyId,
        items: {
          create: items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: new Prisma.Decimal(item.priceAtPurchase),
          })),
        },
      } as Prisma.OrderUncheckedCreateInput,
      include: { customer: true, items: true },
    });

    return this.mapToDomain(saved as PrismaOrderWithRelations);
  }

  async updateStatus(id: string, status: OrderStatus, tx?: unknown): Promise<void> {
    const prismaClient = (tx as Prisma.TransactionClient) || this.prisma;
    await prismaClient.order.update({
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
          { friendlyId: { contains: filters.search, mode: "insensitive" } },
        ],
      } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { customer: true, items: true },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: (items as PrismaOrderWithRelations[]).map(this.mapToDomain.bind(this)),
      total,
    };
  }

  async findPendingPOSOrder(customerId: string, tx?: unknown): Promise<DomainOrder | null> {
    const client = (tx as Prisma.TransactionClient) || this.prisma;
    const item = await client.order.findFirst({
      where: {
        customerId,
        status: "PENDING",
        source: "POS",
      },
      include: { items: { include: { product: true } }, customer: true },
    });
    return item ? this.mapToDomain(item as PrismaOrderWithRelations) : null;
  }

  async appendToOrder(orderId: string, items: { productId: string; quantity: number; priceAtPurchase: number }[], totalAmountIncrement: number, tx?: unknown): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const execute = async (prismaClient: any) => {
      // 1. Update order total
      await prismaClient.order.update({
        where: { id: orderId },
        data: { totalAmount: { increment: new Prisma.Decimal(totalAmountIncrement) } },
      });

      // 2. Add/Update items
      for (const item of items) {
        const existingItem = await prismaClient.orderItem.findFirst({
          where: { orderId, productId: item.productId },
        });

        if (existingItem) {
          await prismaClient.orderItem.update({
            where: { id: existingItem.id },
            data: { quantity: { increment: item.quantity } },
          });
        } else {
          await prismaClient.orderItem.create({
            data: {
              orderId,
              productId: item.productId,
              quantity: item.quantity,
              priceAtPurchase: new Prisma.Decimal(item.priceAtPurchase),
            },
          });
        }
      }
    };

    if (tx) {
      await execute(tx as Prisma.TransactionClient);
    } else {
      await this.prisma.$transaction(async (prismaTx) => {
        await execute(prismaTx);
      });
    }
  }

  async savePayments(orderId: string, payments: { method: PaymentMethodType; amount: number }[], tx?: unknown): Promise<void> {
    const prismaClient = (tx as Prisma.TransactionClient) || this.prisma;
    await prismaClient.orderPayment.createMany({
      data: payments.map((p) => ({
        orderId,
        method: p.method,
        amount: new Prisma.Decimal(p.amount),
      })),
    });
  }
}
