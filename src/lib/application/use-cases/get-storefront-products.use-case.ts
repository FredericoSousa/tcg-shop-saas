import { prisma } from "@/lib/prisma";
import { Product as DomainProduct, ProductCategory } from "@/lib/domain/entities/product";
import { Prisma } from "@prisma/client";

export interface StorefrontProductsFilters {
  search?: string;
  categoryId?: string;
}

export interface StorefrontProductsResult {
  items: DomainProduct[];
  categories: ProductCategory[];
}

export class GetStorefrontProductsUseCase {
  async execute(tenantId: string, filters?: StorefrontProductsFilters): Promise<StorefrontProductsResult> {
    const where: Prisma.ProductWhereInput = {
      tenantId,
      active: true,
      deletedAt: null,
      category: {
        showOnEcommerce: true,
        deletedAt: null,
      },
      ...(filters?.search ? { name: { contains: filters.search, mode: "insensitive" as const } } : {}),
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
    };

    const [rawItems, rawCategories] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
      }),
      prisma.productCategory.findMany({
        where: {
          tenantId,
          showOnEcommerce: true,
          deletedAt: null,
          products: {
            some: {
              active: true,
              deletedAt: null,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const items: DomainProduct[] = rawItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      price: Number(item.price),
      stock: item.stock,
      active: item.active,
      allowNegativeStock: item.allowNegativeStock,
      categoryId: item.categoryId,
      tenantId: item.tenantId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
      category: item.category
        ? {
            id: item.category.id,
            name: item.category.name,
            description: item.category.description,
            showOnEcommerce: item.category.showOnEcommerce,
            tenantId: item.category.tenantId,
            createdAt: item.category.createdAt,
            updatedAt: item.category.updatedAt,
            deletedAt: item.category.deletedAt,
          }
        : undefined,
    }));

    const categories: ProductCategory[] = rawCategories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      showOnEcommerce: c.showOnEcommerce,
      tenantId: c.tenantId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      deletedAt: c.deletedAt,
    }));

    return { items, categories };
  }
}
