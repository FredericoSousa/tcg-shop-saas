import { injectable } from "tsyringe";
import { BasePrismaRepository } from "./base-prisma.repository";
import { ICustomerCreditLedgerRepository } from "@/lib/domain/repositories/customer-credit-ledger.repository";
import { CustomerCreditLedger as DomainCreditLedger, CreditLedgerType, CreditLedgerSource } from "@/lib/domain/entities/customer-credit-ledger";
import { Prisma, CustomerCreditLedger as PrismaCreditLedger } from "@prisma/client";

@injectable()
export class PrismaCustomerCreditLedgerRepository extends BasePrismaRepository implements ICustomerCreditLedgerRepository {
  private mapToDomain(item: PrismaCreditLedger): DomainCreditLedger {
    return {
      id: item.id,
      tenantId: item.tenantId,
      customerId: item.customerId,
      orderId: item.orderId,
      orderFriendlyId: (item as any).order?.friendlyId,
      amount: Number(item.amount),
      type: item.type as CreditLedgerType,
      source: item.source as CreditLedgerSource,
      description: item.description,
      createdAt: item.createdAt,
    };
  }

  async save(ledger: Omit<DomainCreditLedger, "id" | "createdAt">, tx?: any): Promise<DomainCreditLedger> {
    const prismaClient = tx || this.prisma;
    const saved = await prismaClient.customerCreditLedger.create({
      data: {
        tenantId: ledger.tenantId,
        customerId: ledger.customerId,
        orderId: ledger.orderId,
        amount: new Prisma.Decimal(ledger.amount),
        type: ledger.type,
        source: ledger.source,
        description: ledger.description,
      },
    });
    return this.mapToDomain(saved);
  }

  async findByCustomerId(customerId: string): Promise<DomainCreditLedger[]> {
    const items = await this.prisma.customerCreditLedger.findMany({
      where: { customerId },
      include: { order: { select: { friendlyId: true } } },
      orderBy: { createdAt: "desc" },
    });
    return items.map(this.mapToDomain.bind(this));
  }

  async findByOrderId(orderId: string): Promise<DomainCreditLedger[]> {
    const items = await this.prisma.customerCreditLedger.findMany({
      where: { orderId },
      include: { order: { select: { friendlyId: true } } },
      orderBy: { createdAt: "desc" },
    });
    return items.map(this.mapToDomain.bind(this));
  }
}
