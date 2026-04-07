import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";

export async function getOrdersPaginated(
  tenantId: string,
  page: number,
  limit: number,
  filters: {
    source?: "POS" | "ECOMMERCE" | "all";
    status?: OrderStatus | "all";
    search?: string;
    customerPhone?: string;
  } = {}
) {
  const skip = (page - 1) * limit;

  const where: Prisma.OrderWhereInput = {
    tenantId,
    ...(filters.source && filters.source !== "all" ? { source: filters.source as "POS" | "ECOMMERCE" } : {}),
    ...(filters.status && filters.status !== "all" ? { status: filters.status as OrderStatus } : {}),
    ...(filters.customerPhone ? { customer: { phoneNumber: filters.customerPhone } } : {}),
    ...(filters.search
      ? {
          OR: [
            { customer: { name: { contains: filters.search, mode: "insensitive" } } },
            { customer: { phoneNumber: { contains: filters.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        items: {
          include: {
            inventoryItem: {
              include: {
                cardTemplate: true,
              },
            },
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  // Format Decimal fields strictly for JSON Client Boundary transmission
  const formattedItems = items.map((order) => ({
    ...order,
    totalAmount: Number(order.totalAmount),
    customer: {
      name: order.customer.name,
      phoneNumber: order.customer.phoneNumber,
    },
    items: order.items.map((item) => ({
      ...item,
      priceAtPurchase: Number(item.priceAtPurchase),
      inventoryItem: item.inventoryItem ? {
        ...item.inventoryItem,
        price: Number(item.inventoryItem.price),
      } : null,
      product: item.product ? {
        ...item.product,
        price: Number(item.product.price),
      } : null,
    })),
  }));

  return {
    items: formattedItems,
    total,
    pageCount: Math.ceil(total / limit),
  };
}
