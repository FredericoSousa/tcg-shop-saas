import { prisma } from "../../prisma";
import { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import { InventoryItem as DomainInventoryItem } from "@/lib/domain/entities/inventory";
import { Prisma } from "@prisma/client";

export class PrismaInventoryRepository implements IInventoryRepository {
  private mapToDomain(item: any): DomainInventoryItem {
    return {
      id: item.id,
      tenantId: item.tenantId,
      cardTemplateId: item.cardTemplateId,
      price: Number(item.price),
      quantity: item.quantity,
      condition: item.condition,
      language: item.language,
      active: item.active,
      extras: item.extras,
      cardTemplate: item.cardTemplate ? {
        id: item.cardTemplate.id,
        name: item.cardTemplate.name,
        set: item.cardTemplate.set,
        imageUrl: item.cardTemplate.imageUrl,
        backImageUrl: item.cardTemplate.backImageUrl,
        game: item.cardTemplate.game,
        metadata: item.cardTemplate.metadata as Record<string, any> | null,
      } : undefined,
    };
  }

  async findById(id: string, tenantId: string): Promise<DomainInventoryItem | null> {
    const item = await prisma.inventoryItem.findFirst({
      where: { id, tenantId },
      include: { cardTemplate: true },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findByTemplate(
    tenantId: string, 
    templateId: string, 
    filters: Partial<DomainInventoryItem>
  ): Promise<DomainInventoryItem | null> {
    const item = await prisma.inventoryItem.findFirst({
      where: {
        tenantId,
        cardTemplateId: templateId,
        price: filters.price ? new Prisma.Decimal(filters.price) : undefined,
        condition: filters.condition as any,
        language: filters.language,
        extras: filters.extras ? { equals: filters.extras } : undefined,
      },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async save(item: DomainInventoryItem): Promise<DomainInventoryItem> {
    const data = {
      id: item.id,
      tenantId: item.tenantId,
      cardTemplateId: item.cardTemplateId,
      price: new Prisma.Decimal(item.price),
      quantity: item.quantity,
      condition: item.condition as any,
      language: item.language,
      active: item.active,
      extras: item.extras,
    };

    const saved = await prisma.inventoryItem.upsert({
      where: { id: item.id || "" },
      create: data,
      update: data,
    });

    return this.mapToDomain(saved);
  }

  async update(id: string, tenantId: string, data: Partial<DomainInventoryItem>): Promise<DomainInventoryItem> {
    const prismaData: Prisma.InventoryItemUpdateInput = {};
    if (data.price !== undefined) prismaData.price = new Prisma.Decimal(data.price);
    if (data.quantity !== undefined) prismaData.quantity = data.quantity;
    if (data.active !== undefined) prismaData.active = data.active;

    const updated = await prisma.inventoryItem.update({
      where: { id, tenantId },
      data: prismaData,
    });

    return this.mapToDomain(updated);
  }

  async deleteMany(ids: string[], tenantId: string): Promise<void> {
    await prisma.inventoryItem.updateMany({
      where: { id: { in: ids }, tenantId },
      data: { active: false },
    });
  }

  async findPaginated(
    tenantId: string, 
    page: number, 
    limit: number, 
    search?: string
  ): Promise<{ items: DomainInventoryItem[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.InventoryItemWhereInput = {
      tenantId,
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

  async decrementStock(id: string, tenantId: string, quantity: number): Promise<void> {
    const result = await prisma.inventoryItem.updateMany({
      where: {
        id,
        tenantId,
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
}
