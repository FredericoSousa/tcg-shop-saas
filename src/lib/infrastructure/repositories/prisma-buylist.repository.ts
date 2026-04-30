import { injectable } from "tsyringe";
import { BasePrismaRepository } from "./base-prisma.repository";
import { IBuylistRepository } from "@/lib/domain/repositories/buylist.repository";
import { 
  BuylistItem as DomainBuylistItem, 
  BuylistProposal as DomainBuylistProposal, 
  BuylistStatus as DomainBuylistStatus 
} from "@/lib/domain/entities/buylist";
import { 
  Prisma, 
  BuylistStatus as PrismaBuylistStatus, 
  Condition as PrismaCondition 
} from "@prisma/client";

@injectable()
export class PrismaBuylistRepository extends BasePrismaRepository implements IBuylistRepository {
  
  // Mapping Helpers
  private mapItemToDomain(item: unknown): DomainBuylistItem {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const i = item as any;
    return {
      id: i.id,
      tenantId: i.tenantId,
      cardTemplateId: i.cardTemplateId,
      priceCash: Number(i.priceCash),
      priceCredit: Number(i.priceCredit),
      active: i.active,
      cardTemplate: i.cardTemplate ? {
        id: i.cardTemplate.id,
        name: i.cardTemplate.name,
        set: i.cardTemplate.set,
        imageUrl: i.cardTemplate.imageUrl,
        backImageUrl: i.cardTemplate.backImageUrl,
        game: i.cardTemplate.game,
        metadata: i.cardTemplate.metadata,
      } : undefined
    };
  }

  private mapProposalToDomain(p: unknown): DomainBuylistProposal {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = p as any;
    return {
      id: d.id,
      tenantId: d.tenantId,
      customerId: d.customerId,
      status: d.status as DomainBuylistStatus,
      totalCash: Number(d.totalCash),
      totalCredit: Number(d.totalCredit),
      staffNotes: d.staffNotes,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      customer: d.customer ? {
        name: d.customer.name,
        phoneNumber: d.customer.phoneNumber,
      } : undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: d.items?.map((item: any) => ({
        id: item.id,
        buylistProposalId: item.buylistProposalId,
        cardTemplateId: item.cardTemplateId,
        quantity: item.quantity,
        condition: item.condition,
        language: item.language,
        priceCash: Number(item.priceCash),
        priceCredit: Number(item.priceCredit),
        cardTemplate: item.cardTemplate ? {
          id: item.cardTemplate.id,
          name: item.cardTemplate.name,
          set: item.cardTemplate.set,
          imageUrl: item.cardTemplate.imageUrl,
          backImageUrl: item.cardTemplate.backImageUrl,
          game: item.cardTemplate.game,
          metadata: item.cardTemplate.metadata,
        } : undefined
      }))
    };
  }

  // Buylist Items
  async findItemsByTenant(tenantId: string): Promise<DomainBuylistItem[]> {
    const items = await this.prisma.buylistItem.findMany({
      where: { tenantId, active: true },
      include: { cardTemplate: true },
    });
    return items.map(this.mapItemToDomain);
  }

  async findStorefrontItems(tenantId: string, page: number, pageSize: number, filters?: Record<string, unknown>): Promise<DomainBuylistItem[]> {
    const where: Prisma.BuylistItemWhereInput = {
      tenantId,
      active: true,
    };

    if (filters) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = filters as any;
      const templateFilters: Prisma.CardTemplateWhereInput = {};

      if (f.search) {
        templateFilters.name = { contains: f.search, mode: 'insensitive' };
      }

      if (f.color) {
        const colors = f.color.split(',');
        templateFilters.metadata = {
          path: ['colors'],
          array_contains: colors,
        };
      }

      if (f.type) {
        const types = f.type.split(',');
        templateFilters.metadata = {
          path: ['type_line'],
          string_contains: types[0], // Simplified for now, similar to singles logic
        };
      }

      if (f.set) {
        templateFilters.set = f.set;
      }

      where.cardTemplate = templateFilters;
    }

    const items = await this.prisma.buylistItem.findMany({
      where,
      include: { cardTemplate: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { cardTemplate: { name: 'asc' } },
    });

    return items.map(this.mapItemToDomain);
  }

  async countItems(tenantId: string, filters?: Record<string, unknown>): Promise<number> {
    const f = (filters || {}) as { search?: string; color?: string; set?: string };
    const where: Prisma.BuylistItemWhereInput = {
      tenantId,
      active: true,
    };

    if (filters) {
      const templateFilters: Prisma.CardTemplateWhereInput = {};

      if (f.search) {
        templateFilters.name = { contains: f.search, mode: 'insensitive' };
      }

      if (f.color) {
        const colors = f.color.split(',');
        templateFilters.metadata = {
          path: ['colors'],
          array_contains: colors,
        };
      }

      if (f.set) {
        templateFilters.set = f.set;
      }

      where.cardTemplate = templateFilters;
    }

    return this.prisma.buylistItem.count({ where });
  }

  async findItemByTemplate(tenantId: string, cardTemplateId: string): Promise<DomainBuylistItem | null> {
    const item = await this.prisma.buylistItem.findFirst({
      where: { tenantId, cardTemplateId },
      include: { cardTemplate: true },
    });
    return item ? this.mapItemToDomain(item) : null;
  }

  async saveItem(item: DomainBuylistItem): Promise<DomainBuylistItem> {
    const data = {
      tenantId: item.tenantId,
      cardTemplateId: item.cardTemplateId,
      priceCash: new Prisma.Decimal(item.priceCash),
      priceCredit: new Prisma.Decimal(item.priceCredit),
      active: item.active,
    };

    if (!item.id || item.id === "") {
      const saved = await this.prisma.buylistItem.create({
        data,
      });
      return this.mapItemToDomain(saved);
    }

    const saved = await this.prisma.buylistItem.upsert({
      where: { id: item.id },
      create: data,
      update: data,
    });

    return this.mapItemToDomain(saved);
  }

  async deleteItem(id: string): Promise<void> {
    await this.prisma.buylistItem.delete({ where: { id } });
  }

  // Proposals
  async saveProposal(p: DomainBuylistProposal): Promise<DomainBuylistProposal> {
    const saved = await this.prisma.buylistProposal.create({
      data: {
        tenantId: p.tenantId,
        customerId: p.customerId,
        status: p.status as PrismaBuylistStatus,
        totalCash: new Prisma.Decimal(p.totalCash),
        totalCredit: new Prisma.Decimal(p.totalCredit),
        staffNotes: p.staffNotes,
        items: {
          create: p.items?.map(item => ({
            cardTemplateId: item.cardTemplateId,
            quantity: item.quantity,
            condition: item.condition as PrismaCondition,
            language: item.language,
            priceCash: new Prisma.Decimal(item.priceCash),
            priceCredit: new Prisma.Decimal(item.priceCredit),
          }))
        }
      },
      include: { 
        items: { include: { cardTemplate: true } },
        customer: true 
      }
    });

    return this.mapProposalToDomain(saved);
  }

  async findProposalById(id: string): Promise<DomainBuylistProposal | null> {
    const p = await this.prisma.buylistProposal.findUnique({
      where: { id },
      include: { 
        items: { include: { cardTemplate: true } },
        customer: true 
      }
    });
    return p ? this.mapProposalToDomain(p) : null;
  }

  async findProposalsByTenant(tenantId: string): Promise<DomainBuylistProposal[]> {
    const proposals = await this.prisma.buylistProposal.findMany({
      where: { tenantId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });
    return proposals.map(this.mapProposalToDomain);
  }

  async findProposalsByCustomerId(customerId: string): Promise<DomainBuylistProposal[]> {
    const proposals = await this.prisma.buylistProposal.findMany({
      where: { customerId },
      include: {
        items: { include: { cardTemplate: true } },
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return proposals.map(this.mapProposalToDomain);
  }

  async updateProposalStatus(
    id: string,
    status: DomainBuylistStatus,
    staffNotes?: string,
    tx?: unknown,
  ): Promise<void> {
    const client = (tx as Prisma.TransactionClient) || this.prisma;
    await client.buylistProposal.update({
      where: { id },
      data: {
        status: status as PrismaBuylistStatus,
        ...(staffNotes !== undefined ? { staffNotes } : {}),
      },
    });
  }
}
