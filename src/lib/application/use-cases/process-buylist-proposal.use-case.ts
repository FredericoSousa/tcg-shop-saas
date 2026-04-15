import { inject, injectable } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IBuylistRepository } from "@/lib/domain/repositories/buylist.repository";
import { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { ICustomerCreditLedgerRepository } from "@/lib/domain/repositories/customer-credit-ledger.repository";
import { IUseCase } from "./use-case.interface";

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

    if (request.action === 'CANCEL') {
      await this.buylistRepository.updateProposalStatus(request.proposalId, 'CANCELLED', request.staffNotes);
      return;
    }

    // Approval logic
    if (request.paymentMethod === 'STORE_CREDIT') {
      // 1. Update Customer Credit
      const customer = await this.customerRepository.findById(proposal.customerId);
      if (!customer) throw new Error("Cliente não encontrado.");

      const newBalance = Number(customer.creditBalance) + proposal.totalCredit;
      await this.customerRepository.update(customer.id, { creditBalance: newBalance });

      // 2. Add Ledger Entry
      await this.creditLedgerRepository.save({
        id: "",
        tenantId: proposal.tenantId,
        customerId: proposal.customerId,
        amount: proposal.totalCredit,
        type: 'CREDIT',
        source: 'BUYLIST_PROPOSAL',
        description: `Crédito referente à Proposta de Buylist #${proposal.id.slice(0, 8)}`,
        createdAt: new Date(),
      });
      
      await this.buylistRepository.updateProposalStatus(request.proposalId, 'PAID', request.staffNotes);
    } else {
      await this.buylistRepository.updateProposalStatus(request.proposalId, 'APPROVED', request.staffNotes);
    }

    // 3. Increment Inventory for each item
    if (proposal.items) {
      for (const item of proposal.items) {
        // Try to find existing inventory item with same template, condition, language and tenant
        const existingItems = await this.inventoryRepository.findAllActive(proposal.tenantId);
        // This is a bit inefficient, but standard for now. 
        // We'll filter for same template, condition, language.
        const matches = existingItems.find(i => 
          i.cardTemplateId === item.cardTemplateId && 
          i.condition === item.condition && 
          i.language === item.language
        );

        if (matches) {
          await this.inventoryRepository.update(matches.id, { quantity: matches.quantity + item.quantity });
        } else {
          await this.inventoryRepository.save({
            id: "",
            tenantId: proposal.tenantId,
            cardTemplateId: item.cardTemplateId,
            price: Number(item.priceCash) * 1.5, // Default sell price logic: 50% markup over buy price?
            quantity: item.quantity,
            condition: item.condition,
            language: item.language,
            active: true,
            allowNegativeStock: false,
            extras: [],
          });
        }
      }
    }
  }
}
