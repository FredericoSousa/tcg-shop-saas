import { inject, injectable } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IBuylistRepository } from "@/lib/domain/repositories/buylist.repository";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import type { ICustomerCreditLedgerRepository } from "@/lib/domain/repositories/customer-credit-ledger.repository";
import { IUseCase } from "./use-case.interface";
import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";

interface ProcessBuylistProposalRequest {
  proposalId: string;
  action: 'APPROVE' | 'CANCEL';
  paymentMethod: 'CASH' | 'STORE_CREDIT';
  staffNotes?: string;
}

@injectable()
export class ProcessBuylistProposalUseCase implements IUseCase<ProcessBuylistProposalRequest, void> {
  constructor(
    @inject(TOKENS.BuylistRepository)
    private buylistRepository: IBuylistRepository,
    @inject(TOKENS.InventoryRepository)
    private inventoryRepository: IInventoryRepository,
    @inject(TOKENS.CustomerRepository)
    private customerRepository: ICustomerRepository,
    @inject(TOKENS.CustomerCreditLedgerRepository)
    private creditLedgerRepository: ICustomerCreditLedgerRepository
  ) {}

  async execute(request: ProcessBuylistProposalRequest): Promise<void> {
    const proposal = await this.buylistRepository.findProposalById(request.proposalId);
    if (!proposal) throw new Error("Proposta não encontrada.");

    if (proposal.status !== 'PENDING') {
      throw new Error("Apenas propostas pendentes podem ser processadas.");
    }

    if (request.action === 'CANCEL') {
      await this.buylistRepository.updateProposalStatus(request.proposalId, 'CANCELLED', request.staffNotes);
      
      // Publish event
      domainEvents.publish(DOMAIN_EVENTS.BUYLIST_PROPOSAL_REJECTED, {
        proposalId: request.proposalId,
        staffNotes: request.staffNotes
      }).catch(err => console.error("Error publishing BUYLIST_PROPOSAL_REJECTED:", err));

      return;
    }

    // Approval logic
    const newStatus = request.paymentMethod === 'STORE_CREDIT' ? 'PAID' : 'APPROVED';
    await this.buylistRepository.updateProposalStatus(request.proposalId, newStatus, request.staffNotes);

    // Publish event - Side effects (inventory, credit) are now handled by event handlers
    domainEvents.publish(DOMAIN_EVENTS.BUYLIST_PROPOSAL_APPROVED, {
      proposalId: proposal.id,
      paymentMethod: request.paymentMethod,
      tenantId: proposal.tenantId,
      customerId: proposal.customerId,
      amount: request.paymentMethod === 'STORE_CREDIT' ? proposal.totalCredit : proposal.totalCash,
      items: proposal.items
    }).catch(err => console.error("Error publishing BUYLIST_PROPOSAL_APPROVED:", err));
  }
}
