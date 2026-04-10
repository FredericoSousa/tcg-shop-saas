import { injectable } from "tsyringe";
import { BasePrismaRepository } from "./base-prisma.repository";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import type { InventoryItem as DomainInventoryItem } from "@/lib/domain/entities/inventory";
import { InventoryItem as PrismaInventoryItem, CardTemplate as PrismaCardTemplate, Prisma, Condition as PrismaCondition } from "@prisma/client";

type PrismaInventoryWithTemplate = PrismaInventoryItem & {
  cardTemplate?: PrismaCardTemplate | null;
};

@injectable()
export class PrismaInventoryRepository extends BasePrismaRepository implements IInventoryRepository {
  private mapToDomain(item: PrismaInventoryWithTemplate): DomainInventoryItem {
    return {
      id: item.id,
      tenantId: item.tenantId,
      cardTemplateId: item.cardTemplateId,
      price: Number(item.price),
      quantity: item.quantity,
      language: item.language,
      active: item.active,
      allowNegativeStock: item.allowNegativeStock,
      extras: item.extras as string[],
      condition: item.condition as string,
      cardTemplate: item.cardTemplate ? {
        id: item.cardTemplate.id,
        name: item.cardTemplate.name,
        set: item.cardTemplate.set,
        imageUrl: item.cardTemplate.imageUrl,
        backImageUrl: item.cardTemplate.backImageUrl,
        game: item.cardTemplate.game,
        metadata: item.cardTemplate.metadata as Record<string, unknown> | null,
      } : undefined,
    };
  }

  async findById(id: string): Promise<DomainInventoryItem | null> {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id },
      include: { cardTemplate: true },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findByTemplate(
    templateId: string, 
    filters: Partial<DomainInventoryItem>
  ): Promise<DomainInventoryItem | null> {
    const item = await this.prisma.inventoryItem.findFirst({
      where: {
        cardTemplateId: templateId,
        price: filters.price ? new Prisma.Decimal(filters.price) : undefined,
        condition: filters.condition as PrismaCondition,
        language: filters.language,
        extras: filters.extras ? { equals: filters.extras } : undefined,
      },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findManyByTemplates(
    templateIds: string[], 
    tenantId: string
  ): Promise<DomainInventoryItem[]> {
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        tenantId,
        cardTemplateId: { in: templateIds },
      },
    });
    return items.map(this.mapToDomain.bind(this));
  }

  async save(item: DomainInventoryItem): Promise<DomainInventoryItem> {
    const data = {
      cardTemplateId: item.cardTemplateId,
      price: new Prisma.Decimal(item.price),
      quantity: item.quantity,
      condition: item.condition as PrismaCondition,
      language: item.language,
      active: item.active,
      allowNegativeStock: item.allowNegativeStock,
      extras: item.extras,
    };

    const saved = await this.prisma.inventoryItem.upsert({
      where: { id: item.id || "" },
      create: { ...data, tenantId: item.tenantId },
      update: data,
    });

    return this.mapToDomain(saved);
  }

  async createMany(items: DomainInventoryItem[]): Promise<void> {
    await this.prisma.inventoryItem.createMany({
      data: items.map((item) => ({
        tenantId: item.tenantId,
        cardTemplateId: item.cardTemplateId,
        price: new Prisma.Decimal(item.price),
        quantity: item.quantity,
        condition: item.condition as PrismaCondition,
        language: item.language,
        active: item.active,
        allowNegativeStock: item.allowNegativeStock,
        extras: item.extras,
      })),
    });
  }

  async update(id: string, data: Partial<DomainInventoryItem>): Promise<DomainInventoryItem> {
    const prismaData: Prisma.InventoryItemUpdateInput = {};
    if (data.price !== undefined) prismaData.price = new Prisma.Decimal(data.price);
    if (data.quantity !== undefined) prismaData.quantity = data.quantity;
    if (data.active !== undefined) prismaData.active = data.active;
    if (data.allowNegativeStock !== undefined) prismaData.allowNegativeStock = data.allowNegativeStock;

    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data: prismaData,
    });

    return this.mapToDomain(updated);
  }

  async updateMany(ids: string[], data: Partial<DomainInventoryItem>): Promise<void> {
    const prismaData: Prisma.InventoryItemUpdateManyMutationInput = {};
    if (data.price !== undefined) prismaData.price = new Prisma.Decimal(data.price);
    if (data.quantity !== undefined) prismaData.quantity = data.quantity;
    if (data.active !== undefined) prismaData.active = data.active;
    if (data.allowNegativeStock !== undefined) prismaData.allowNegativeStock = data.allowNegativeStock;

    await this.prisma.inventoryItem.updateMany({
      where: { id: { in: ids } },
      data: prismaData,
    });
  }

  async deleteMany(ids: string[]): Promise<void> {
    await this.prisma.inventoryItem.updateMany({
      where: { id: { in: ids } },
      data: { active: false },
    });
  }

  async findPaginated(
    page: number, 
    limit: number, 
    search?: string
  ): Promise<{ items: DomainInventoryItem[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.InventoryItemWhereInput = {
      active: true,
      ...(search ? {
        cardTemplate: {
          name: { contains: search, mode: "insensitive" }
        }
      } : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        include: { cardTemplate: true },
        orderBy: { cardTemplate: { name: "asc" } },
        skip,
        take: limit,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return {
      items: items.map(this.mapToDomain.bind(this)),
      total,
    };
  }

  async findStorefrontItems(
    tenantId: string,
    page: number,
    limit: number,
    filters?: any
  ): Promise<{ items: DomainInventoryItem[]; total: number }> {
    const skip = (page - 1) * limit;
    
    // For now, storefront items might need complex JS filtering as seen in service
    // But we'll try to do as much as possible in Prisma.
    const where: Prisma.InventoryItemWhereInput = {
      tenantId,
      active: true,
      quantity: { gt: 0 },
      ...(filters?.set ? { cardTemplate: { set: { equals: filters.set, mode: 'insensitive' } } } : {}),
      ...(filters?.language ? { language: filters.language } : {}),
      ...(filters?.search ? {
        cardTemplate: {
          name: { contains: filters.search, mode: "insensitive" }
        }
      } : {})
    };

    const orderBy: Prisma.InventoryItemOrderByWithRelationInput = {};
    if (filters?.sort === 'price_asc') orderBy.price = 'asc';
    else if (filters?.sort === 'price_desc') orderBy.price = 'desc';
    else if (filters?.sort === 'name_asc') orderBy.cardTemplate = { name: 'asc' };
    else if (filters?.sort === 'name_desc') orderBy.cardTemplate = { name: 'desc' };
    else orderBy.cardTemplate = { name: 'asc' };

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        include: { cardTemplate: true },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return {
      items: items.map(this.mapToDomain.bind(this)),
      total,
    };
  }

  async findAllActive(tenantId: string): Promise<DomainInventoryItem[]> {
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        tenantId,
        active: true,
      },
      include: { cardTemplate: true },
    });
    return items.map(this.mapToDomain.bind(this));
  }

  async decrementStock(id: string, quantity: number): Promise<void> {
    const result = await this.prisma.inventoryItem.updateMany({
      where: {
        id,
        OR: [
          { allowNegativeStock: true },
          { quantity: { gte: quantity } }
        ]
      },
      data: {
        quantity: { decrement: quantity },
      },
    });

    if (result.count === 0) {
      throw new Error("Item esgotado ou quantidade insuficiente no estoque.");
    }
  }

  async countActive(tenantId: string): Promise<number> {
    return this.prisma.inventoryItem.count({
      where: { tenantId, active: true },
    });
  }
}
