import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getCustomersPaginated(
  tenantId: string,
  page: number,
  limit: number,
  search?: string,
  includeDeleted = false
) {
  const skip = (page - 1) * limit;

  const where: Prisma.CustomerWhereInput = {
    tenantId,
    ...(includeDeleted ? {} : { deletedAt: null }),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phoneNumber: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    items,
    total,
    pageCount: Math.ceil(total / limit),
  };
}

export async function createCustomer(tenantId: string, data: { name: string; email?: string; phoneNumber: string }) {
  return prisma.customer.create({
    data: {
      ...data,
      tenantId,
    },
  });
}

export async function updateCustomer(
  tenantId: string,
  id: string,
  data: { name?: string; email?: string; phoneNumber?: string }
) {
  return prisma.customer.update({
    where: {
      id,
      tenantId,
    },
    data,
  });
}

export async function softDeleteCustomer(tenantId: string, id: string) {
  return prisma.customer.update({
    where: {
      id,
      tenantId,
    },
    data: {
      deletedAt: new Date(),
    },
  });
}

export async function restoreCustomer(tenantId: string, id: string) {
  return prisma.customer.update({
    where: {
      id,
      tenantId,
    },
    data: {
      deletedAt: null,
    },
  });
}

export async function getCustomerWithOrders(tenantId: string, id: string) {
  return prisma.customer.findUnique({
    where: {
      id,
      tenantId,
    },
    // We can keep this for initial load or just profile if preferred.
    // The user wants a separate orders endpoint, so we might want to reduce the load here.
  });
}

export async function getCustomerOrdersPaginated(
  tenantId: string,
  customerId: string,
  page: number,
  limit: number
) {
  const skip = (page - 1) * limit;

  const where: Prisma.OrderWhereInput = {
    tenantId,
    customerId,
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      include: {
        items: {
          include: {
            inventoryItem: {
              include: {
                cardTemplate: true,
              },
            },
            product: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items,
    total,
    pageCount: Math.ceil(total / limit),
  };
}

export async function getCustomerStats(tenantId: string, customerId: string) {
  const stats = await prisma.order.aggregate({
    where: { customerId, tenantId },
    _sum: { totalAmount: true },
    _count: { id: true },
  });

  return {
    totalSpent: Number(stats._sum.totalAmount || 0),
    totalOrders: stats._count.id,
  };
}
