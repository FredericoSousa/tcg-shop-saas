import { injectable } from "tsyringe";
import { BasePrismaRepository } from "./base-prisma.repository";
import { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { Product as DomainProduct, ProductCategory as DomainCategory } from "@/lib/domain/entities/product";
import { Prisma, Product as PrismaProduct, ProductCategory as PrismaCategory } from "@prisma/client";

@injectable()
export class PrismaProductRepository extends BasePrismaRepository implements IProductRepository {
  private mapToDomain(item: PrismaProduct & { category?: PrismaCategory | null }): DomainProduct {
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

  private mapCategoryToDomain(item: PrismaCategory): DomainCategory {
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

  async findById(id: string): Promise<DomainProduct | null> {
    const item = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { category: true },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async save(product: DomainProduct): Promise<DomainProduct> {
    const saved = await this.prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: new Prisma.Decimal(product.price),
        stock: product.stock,
        categoryId: product.categoryId,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    });
    return this.mapToDomain(saved);
  }

  async update(id: string, data: Partial<DomainProduct>): Promise<DomainProduct> {
    const updated = await this.prisma.product.update({
      where: { id },
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
    page: number,
    limit: number,
    filters?: { search?: string; categoryId?: string }
  ): Promise<{ items: DomainProduct[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(filters?.search ? { name: { contains: filters.search, mode: "insensitive" } } : {}),
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map(this.mapToDomain.bind(this)),
      total,
    };
  }

  async decrementStock(id: string, quantity: number): Promise<void> {
    const result = await this.prisma.product.updateMany({
      where: {
        id,
        stock: { gte: quantity },
        active: true,
        deletedAt: null,
      },
      data: {
        stock: { decrement: quantity },
      },
    });

    if (result.count === 0) {
      throw new Error(`Produto não encontrado, inativo ou com estoque insuficiente: ${id}`);
    }
  }

  async findCategories(): Promise<DomainCategory[]> {
    const items = await this.prisma.productCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
    return items.map(this.mapCategoryToDomain.bind(this));
  }

  async findCategoryById(id: string): Promise<DomainCategory | null> {
    const item = await this.prisma.productCategory.findFirst({
      where: { id, deletedAt: null },
    });
    return item ? this.mapCategoryToDomain(item) : null;
  }

  async saveCategory(category: DomainCategory): Promise<DomainCategory> {
    const saved = await this.prisma.productCategory.create({
      data: {
        name: category.name,
        description: category.description,
        showOnEcommerce: category.showOnEcommerce,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    });
    return this.mapCategoryToDomain(saved);
  }

  async updateCategory(id: string, data: Partial<DomainCategory>): Promise<DomainCategory> {
    const updated = await this.prisma.productCategory.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        showOnEcommerce: data.showOnEcommerce,
        deletedAt: data.deletedAt,
      },
    });
    return this.mapCategoryToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.update({
      where: { id },
      data: { 
        active: false,
        deletedAt: new Date() 
      },
    });
  }
}
