import { prisma } from "../../prisma";
import { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { Product as DomainProduct, ProductCategory as DomainCategory } from "@/lib/domain/entities/product";
import { Prisma } from "@prisma/client";

export class PrismaProductRepository implements IProductRepository {
  private mapToDomain(item: any): DomainProduct {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      price: Number(item.price),
      stock: item.stock,
      active: item.active,
      categoryId: item.categoryId,
      tenantId: item.tenantId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
      category: item.category ? this.mapCategoryToDomain(item.category) : undefined,
    };
  }

  private mapCategoryToDomain(item: any): DomainCategory {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      showOnEcommerce: item.showOnEcommerce,
      tenantId: item.tenantId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
    };
  }

  async findById(id: string, tenantId: string): Promise<DomainProduct | null> {
    const item = await prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { category: true },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async save(product: DomainProduct): Promise<DomainProduct> {
    const saved = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: new Prisma.Decimal(product.price),
        stock: product.stock,
        categoryId: product.categoryId,
        tenantId: product.tenantId,
      },
    });
    return this.mapToDomain(saved);
  }

  async update(id: string, tenantId: string, data: Partial<DomainProduct>): Promise<DomainProduct> {
    const updated = await prisma.product.update({
      where: { id, tenantId },
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        price: data.price !== undefined ? new Prisma.Decimal(data.price) : undefined,
        stock: data.stock,
        active: data.active,
        categoryId: data.categoryId,
        deletedAt: data.deletedAt,
      },
    });
    return this.mapToDomain(updated);
  }

  async findPaginated(
    tenantId: string,
    page: number,
    limit: number,
    filters?: { search?: string; categoryId?: string }
  ): Promise<{ items: DomainProduct[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = {
      tenantId,
      deletedAt: null,
      ...(filters?.search ? { name: { contains: filters.search, mode: "insensitive" } } : {}),
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items: items.map(this.mapToDomain.bind(this)),
      total,
    };
  }

  async findCategories(tenantId: string): Promise<DomainCategory[]> {
    const items = await prisma.productCategory.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return items.map(this.mapCategoryToDomain);
  }

  async findCategoryById(id: string, tenantId: string): Promise<DomainCategory | null> {
    const item = await prisma.productCategory.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return item ? this.mapCategoryToDomain(item) : null;
  }

  async saveCategory(category: DomainCategory): Promise<DomainCategory> {
    const saved = await prisma.productCategory.create({
      data: {
        name: category.name,
        description: category.description,
        showOnEcommerce: category.showOnEcommerce,
        tenantId: category.tenantId,
      },
    });
    return this.mapCategoryToDomain(saved);
  }

  async updateCategory(id: string, tenantId: string, data: Partial<DomainCategory>): Promise<DomainCategory> {
    const updated = await prisma.productCategory.update({
      where: { id, tenantId },
      data: {
        name: data.name,
        description: data.description,
        showOnEcommerce: data.showOnEcommerce,
        deletedAt: data.deletedAt,
      },
    });
    return this.mapCategoryToDomain(updated);
  }
}
