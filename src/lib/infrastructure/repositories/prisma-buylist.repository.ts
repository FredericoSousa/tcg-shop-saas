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
  private mapItemToDomain(item: any): DomainBuylistItem {
    return {
      id: item.id,
      tenantId: item.tenantId,
      cardTemplateId: item.cardTemplateId,
      priceCash: Number(item.priceCash),
      priceCredit: Number(item.priceCredit),
      active: item.active,
      cardTemplate: item.cardTemplate ? {
        id: item.cardTemplate.id,
        name: item.cardTemplate.name,
        set: item.cardTemplate.set,
        imageUrl: item.cardTemplate.imageUrl,
        backImageUrl: item.cardTemplate.backImageUrl,
        game: item.cardTemplate.game,
        metadata: item.cardTemplate.metadata,
      } : undefined
    };
  }

  private mapProposalToDomain(p: any): DomainBuylistProposal {
    return {
      id: p.id,
      tenantId: p.tenantId,
      customerId: p.customerId,
      status: p.status as DomainBuylistStatus,
      totalCash: Number(p.totalCash),
      totalCredit: Number(p.totalCredit),
      staffNotes: p.staffNotes,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      customer: p.customer ? {
        name: p.customer.name,
        phoneNumber: p.customer.phoneNumber,
      } : undefined,
      items: p.items?.map((item: any) => ({
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
      where: { tenantId },
      include: { cardTemplate: true },
    });
    return items.map(this.mapItemToDomain);
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

  async updateProposalStatus(id: string, status: DomainBuylistStatus, staffNotes?: string): Promise<void> {
    await this.prisma.buylistProposal.update({
      where: { id },
      data: { 
        status: status as PrismaBuylistStatus,
        ...(staffNotes !== undefined ? { staffNotes } : {})
      }
    });
  }
}
