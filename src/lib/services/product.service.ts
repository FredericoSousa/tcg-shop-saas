import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getProductsPaginated(
  tenantId: string,
  page: number,
  limit: number,
  search?: string,
  categoryId?: string
) {
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    tenantId,
    active: true,
    deletedAt: null,
    ...(search ? {
      name: {
        contains: search,
        mode: "insensitive"
      }
    } : {}),
    ...(categoryId ? { categoryId } : {})
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        name: "asc",
      },
      skip,
      take: limit,
    }),
    prisma.product.count({ where })
  ]);

  return {
    items: items.map(item => ({
      ...item,
      price: Number(item.price),
      stock: item.stock
    })),
    total,
    pageCount: Math.ceil(total / limit)
  };
}

export async function getProductById(tenantId: string, id: string) {
  const product = await prisma.product.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: { category: true }
  });
  
  if (!product) return null;
  
  return {
    ...product,
    price: Number(product.price)
  };
}

export async function createProduct(tenantId: string, data: {
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  stock: number;
  categoryId: string;
}) {
  return prisma.product.create({
    data: {
      ...data,
      tenantId,
      price: new Prisma.Decimal(data.price)
    }
  });
}

export async function updateProduct(tenantId: string, id: string, data: {
  name?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
  active?: boolean;
}) {
  return prisma.product.updateMany({
    where: { id, tenantId },
    data: {
      ...data,
      ...(data.price !== undefined ? { price: new Prisma.Decimal(data.price) } : {})
    }
  });
}

export async function deleteProduct(tenantId: string, id: string) {
  return prisma.product.updateMany({
    where: { id, tenantId },
    data: { 
      active: false,
      deletedAt: new Date()
    }
  });
}

// Categories

export async function getCategories(tenantId: string) {
  return prisma.productCategory.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { name: "asc" }
  });
}

export async function createCategory(tenantId: string, data: { name: string; description?: string; showOnEcommerce?: boolean }) {
  return prisma.productCategory.create({
    data: {
      ...data,
      tenantId,
    },
  });
}

export async function updateCategory(id: string, tenantId: string, data: { name?: string; description?: string; showOnEcommerce?: boolean }) {
  return prisma.productCategory.update({
    where: { id, tenantId },
    data,
  });
}

export async function deleteCategory(tenantId: string, id: string) {
  return prisma.productCategory.updateMany({
    where: { id, tenantId },
    data: { deletedAt: new Date() }
  });
}
