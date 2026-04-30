import { inject, injectable } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IBuylistRepository } from "@/lib/domain/repositories/buylist.repository";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import type { ICustomerCreditLedgerRepository } from "@/lib/domain/repositories/customer-credit-ledger.repository";
import { IUseCase } from "../use-case.interface";
import { DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";
import { enqueueDomainEvent } from "@/lib/domain/events/outbox-publisher";
import {
  EntityNotFoundError,
  BusinessRuleViolationError,
} from "@/lib/domain/errors/domain.error";
import { prisma } from "@/lib/prisma";

interface ProcessBuylistProposalRequest {
  proposalId: string;
  action: 'APPROVE' | 'CANCEL';
  paymentMethod: 'CASH' | 'STORE_CREDIT';
  staffNotes?: string;
}

// Default markup applied when a buylist purchase creates a fresh
// inventory row. Stores can still adjust per-item prices afterwards.
const BUYLIST_INVENTORY_MARKUP = 1.5;

@injectable()
export class ProcessBuylistProposalUseCase implements IUseCase<ProcessBuylistProposalRequest, void> {
  constructor(
    @inject(TOKENS.BuylistRepository) private buylistRepo: IBuylistRepository,
    @inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository,
    @inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository,
    @inject(TOKENS.CustomerCreditLedgerRepository)
    private ledgerRepo: ICustomerCreditLedgerRepository,
  ) {}

  async execute(request: ProcessBuylistProposalRequest): Promise<void> {
    const proposal = await this.buylistRepo.findProposalById(request.proposalId);
    if (!proposal) throw new EntityNotFoundError("Proposta", request.proposalId);

    if (proposal.status !== 'PENDING') {
      throw new BusinessRuleViolationError(
        "Apenas propostas pendentes podem ser processadas.",
      );
    }

    if (request.action === 'CANCEL') {
      await prisma.$transaction(async (tx) => {
        await this.buylistRepo.updateProposalStatus(
          request.proposalId,
          'CANCELLED',
          request.staffNotes,
          tx,
        );

        await enqueueDomainEvent(DOMAIN_EVENTS.BUYLIST_PROPOSAL_REJECTED, {
          proposalId: request.proposalId,
          staffNotes: request.staffNotes,
        }, proposal.tenantId, tx);
      });

      return;
    }

    const newStatus = request.paymentMethod === 'STORE_CREDIT' ? 'PAID' : 'APPROVED';
    const creditAmount = request.paymentMethod === 'STORE_CREDIT'
      ? proposal.totalCredit
      : proposal.totalCash;

    // All side effects (status, inventory, balance, ledger) commit
    // together so a failure leaves the proposal untouched.
    await prisma.$transaction(async (tx) => {
      await this.buylistRepo.updateProposalStatus(
        request.proposalId,
        newStatus,
        request.staffNotes,
        tx,
      );

      for (const item of proposal.items ?? []) {
        await this.inventoryRepo.upsertStockForBuylist({
          tenantId: proposal.tenantId,
          cardTemplateId: item.cardTemplateId,
          condition: item.condition,
          language: item.language,
          quantity: item.quantity,
          defaultPrice: Number(item.priceCash) * BUYLIST_INVENTORY_MARKUP,
        }, tx);
      }

      if (request.paymentMethod === 'STORE_CREDIT') {
        await this.customerRepo.updateCreditBalance(proposal.customerId, creditAmount, tx);
        await this.ledgerRepo.save({
          tenantId: proposal.tenantId,
          customerId: proposal.customerId,
          orderId: null,
          amount: creditAmount,
          type: 'CREDIT',
          source: 'BUYLIST_PROPOSAL',
          description: `Crédito referente à Proposta de Buylist #${proposal.id.slice(0, 8)}`,
        }, tx);
      }

      await enqueueDomainEvent(DOMAIN_EVENTS.BUYLIST_PROPOSAL_APPROVED, {
        proposalId: proposal.id,
        paymentMethod: request.paymentMethod,
        tenantId: proposal.tenantId,
        customerId: proposal.customerId,
        amount: creditAmount,
        items: proposal.items,
      }, proposal.tenantId, tx);

      await enqueueDomainEvent(DOMAIN_EVENTS.INVENTORY_UPDATED, {
        tenantId: proposal.tenantId,
        cardIds: (proposal.items ?? []).map(i => i.cardTemplateId),
        source: "buylist_approval",
      }, proposal.tenantId, tx);
    });
  }
}
