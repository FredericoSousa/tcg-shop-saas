import { injectable } from "tsyringe";
import { BasePrismaRepository } from "./base-prisma.repository";
import type { IInventoryRepository, StorefrontFilters } from "@/lib/domain/repositories/inventory.repository";
import type {
  InventoryItem as DomainInventoryItem,
  CardMetadata,
  Condition as DomainCondition,
  Game as DomainGame,
} from "@/lib/domain/entities/inventory";
import { InventoryItem as PrismaInventoryItem, CardTemplate as PrismaCardTemplate, Prisma, Condition as PrismaCondition } from "@prisma/client";
import { InsufficientStockError } from "@/lib/domain/errors/domain.error";

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
      condition: item.condition as DomainCondition,
      cardTemplate: item.cardTemplate ? {
        id: item.cardTemplate.id,
        name: item.cardTemplate.name,
        set: item.cardTemplate.set,
        imageUrl: item.cardTemplate.imageUrl,
        backImageUrl: item.cardTemplate.backImageUrl,
        game: item.cardTemplate.game as DomainGame,
        metadata: item.cardTemplate.metadata as CardMetadata | null,
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
    const prismaData: Prisma.InventoryItemUpdateManyMutationInput = {
      updatedAt: new Date()
    };
    if (data.price !== undefined) prismaData.price = new Prisma.Decimal(data.price);
    if (data.quantity !== undefined) prismaData.quantity = data.quantity;
    if (data.active !== undefined) prismaData.active = data.active;
    if (data.allowNegativeStock !== undefined) prismaData.allowNegativeStock = data.allowNegativeStock;

    await this.prisma.inventoryItem.updateMany({
      where: { id: { in: ids } },
      data: prismaData,
    });
  }

  async deactivateMany(ids: string[]): Promise<void> {
    await this.prisma.inventoryItem.updateMany({
      where: { id: { in: ids } },
      data: { active: false, updatedAt: new Date() },
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
    filters?: StorefrontFilters
  ): Promise<{ items: DomainInventoryItem[]; total: number }> {
    const skip = (page - 1) * limit;

    const toArray = (v: string | string[] | undefined): string[] | undefined => {
      if (!v) return undefined;
      return Array.isArray(v) ? v : v.split(",").filter(Boolean);
    };

    const colors = toArray(filters?.color);
    const types = toArray(filters?.type);
    const subtypes = toArray(filters?.subtype);
    const extras = toArray(filters?.extras);
    const languages = toArray(filters?.language);

    const cardTemplateAnd: Prisma.CardTemplateWhereInput[] = [];

    if (filters?.set) {
      cardTemplateAnd.push({ set: { equals: filters.set, mode: "insensitive" } });
    }

    if (filters?.search) {
      cardTemplateAnd.push({
        name: { contains: filters.search, mode: "insensitive" },
      });
    }

    if (colors && colors.length > 0) {
      const includesColorless = colors.includes("C");
      const explicitColors = colors.filter(c => c !== "C");

      const colorOr: Prisma.CardTemplateWhereInput[] = [];
      if (includesColorless) {
        // Colorless cards: empty `color_identity` array.
        colorOr.push({ metadata: { path: ["color_identity"], equals: [] } });
      }
      for (const c of explicitColors) {
        colorOr.push({ metadata: { path: ["color_identity"], array_contains: [c] } });
      }
      if (colorOr.length > 0) cardTemplateAnd.push({ OR: colorOr });
    }

    if (types && types.length > 0) {
      cardTemplateAnd.push({
        OR: types.map(t => ({
          metadata: { path: ["type_line"], string_contains: t },
        })),
      });
    }

    if (subtypes && subtypes.length > 0) {
      cardTemplateAnd.push({
        OR: subtypes.map(s => ({
          metadata: { path: ["type_line"], string_contains: s },
        })),
      });
    }

    const where: Prisma.InventoryItemWhereInput = {
      tenantId,
      active: true,
      quantity: { gt: 0 },
      ...(languages && languages.length > 0 ? { language: { in: languages } } : {}),
      ...(extras && extras.length > 0 ? { extras: { hasSome: extras } } : {}),
      ...(cardTemplateAnd.length > 0 ? { cardTemplate: { AND: cardTemplateAnd } } : {}),
    };

    const orderBy: Prisma.InventoryItemOrderByWithRelationInput = {};
    if (filters?.sort === "price_asc") orderBy.price = "asc";
    else if (filters?.sort === "price_desc") orderBy.price = "desc";
    else if (filters?.sort === "name_desc") orderBy.cardTemplate = { name: "desc" };
    else orderBy.cardTemplate = { name: "asc" };

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

  async searchStorefront(
    tenantId: string,
    query: string,
    limit: number,
  ): Promise<DomainInventoryItem[]> {
    if (query.length < 2) return [];

    const items = await this.prisma.inventoryItem.findMany({
      where: {
        tenantId,
        active: true,
        quantity: { gt: 0 },
        cardTemplate: {
          name: { contains: query, mode: "insensitive" },
        },
      },
      include: { cardTemplate: true },
      orderBy: { cardTemplate: { name: "asc" } },
      take: limit,
    });

    return items.map(this.mapToDomain.bind(this));
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

  async decrementStock(id: string, quantity: number, tx?: unknown): Promise<void> {
    const client = (tx as Prisma.TransactionClient) || this.prisma;
    const result = await client.inventoryItem.updateMany({
      where: {
        id,
        OR: [
          { allowNegativeStock: true },
          { quantity: { gte: quantity } }
        ]
      },
      data: {
        quantity: { decrement: quantity },
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new InsufficientStockError(id);
    }
  }

  async countActive(tenantId: string): Promise<number> {
    return this.prisma.inventoryItem.count({
      where: { tenantId, active: true },
    });
  }

  async upsertStockForBuylist(
    args: {
      tenantId: string;
      cardTemplateId: string;
      condition: string;
      language: string;
      quantity: number;
      defaultPrice: number;
    },
    tx?: unknown,
  ): Promise<void> {
    const client = (tx as Prisma.TransactionClient) || this.prisma;

    // Match an existing row with empty extras to avoid stacking onto
    // promo/foil variants. Uses an indexed lookup on (tenantId, cardTemplateId).
    const existing = await client.inventoryItem.findFirst({
      where: {
        tenantId: args.tenantId,
        cardTemplateId: args.cardTemplateId,
        condition: args.condition as PrismaCondition,
        language: args.language,
        extras: { equals: [] },
      },
      select: { id: true },
    });

    if (existing) {
      await client.inventoryItem.update({
        where: { id: existing.id },
        data: {
          quantity: { increment: args.quantity },
          active: true,
          updatedAt: new Date(),
        },
      });
      return;
    }

    await client.inventoryItem.create({
      data: {
        tenantId: args.tenantId,
        cardTemplateId: args.cardTemplateId,
        condition: args.condition as PrismaCondition,
        language: args.language,
        quantity: args.quantity,
        price: new Prisma.Decimal(args.defaultPrice),
        active: true,
        allowNegativeStock: false,
        extras: [],
      },
    });
  }
}
