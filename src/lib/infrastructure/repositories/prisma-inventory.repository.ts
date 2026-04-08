/* eslint-disable @typescript-eslint/no-explicit-any */
import "reflect-metadata";
import { injectable } from "tsyringe";
import { prisma } from "../../prisma";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import type { InventoryItem as DomainInventoryItem } from "@/lib/domain/entities/inventory";
import { InventoryItem as PrismaInventoryItem, CardTemplate as PrismaCardTemplate, Prisma, Condition as PrismaCondition } from "@prisma/client";

type PrismaInventoryWithTemplate = PrismaInventoryItem & {
  cardTemplate?: PrismaCardTemplate | null;
};

@injectable()
export class PrismaInventoryRepository implements IInventoryRepository {
  private mapToDomain(item: PrismaInventoryWithTemplate): DomainInventoryItem {
    return {
      id: item.id,
      tenantId: item.tenantId,
      cardTemplateId: item.cardTemplateId,
      price: Number(item.price),
      quantity: item.quantity,
      language: item.language,
      active: item.active,
      extras: item.extras,
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
    const item = await prisma.inventoryItem.findFirst({
      where: { id },
      include: { cardTemplate: true },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findByTemplate(
    templateId: string, 
    filters: Partial<DomainInventoryItem>
  ): Promise<DomainInventoryItem | null> {
    const item = await prisma.inventoryItem.findFirst({
      where: {
        cardTemplateId: templateId,
        price: filters.price ? new Prisma.Decimal(filters.price) : undefined,
        condition: filters.condition as Prisma.EnumConditionFilter,
        language: filters.language,
        extras: filters.extras ? { equals: filters.extras } : undefined,
      },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async save(item: DomainInventoryItem): Promise<DomainInventoryItem> {
    const data = {
      id: item.id,
      cardTemplateId: item.cardTemplateId,
      price: new Prisma.Decimal(item.price),
      quantity: item.quantity,
      condition: item.condition as PrismaCondition,
      language: item.language,
      active: item.active,
      extras: item.extras,
    };

    const saved = await prisma.inventoryItem.upsert({
      where: { id: item.id || "" },
      create: { ...data, tenantId: item.tenantId },
      update: data,
    });

    return this.mapToDomain(saved);
  }

  async update(id: string, data: Partial<DomainInventoryItem>): Promise<DomainInventoryItem> {
    const prismaData: Prisma.InventoryItemUpdateInput = {};
    if (data.price !== undefined) prismaData.price = new Prisma.Decimal(data.price);
    if (data.quantity !== undefined) prismaData.quantity = data.quantity;
    if (data.active !== undefined) prismaData.active = data.active;

    const updated = await prisma.inventoryItem.update({
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

    await prisma.inventoryItem.updateMany({
      where: { id: { in: ids } },
      data: prismaData,
    });
  }

  async deleteMany(ids: string[]): Promise<void> {
    await prisma.inventoryItem.updateMany({
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
      prisma.inventoryItem.findMany({
        where,
        include: { cardTemplate: true },
        orderBy: { cardTemplate: { name: "asc" } },
        skip,
        take: limit,
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return {
      items: items.map(this.mapToDomain.bind(this)),
      total,
    };
  }

  async decrementStock(id: string, quantity: number): Promise<void> {
    const result = await prisma.inventoryItem.updateMany({
      where: {
        id,
        quantity: { gte: quantity },
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
    return prisma.inventoryItem.count({
      where: { tenantId, active: true },
    });
  }
}
