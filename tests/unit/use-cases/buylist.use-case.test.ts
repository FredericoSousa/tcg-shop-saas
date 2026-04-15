import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { SaveBuylistItemUseCase } from '@/lib/application/use-cases/save-buylist-item.use-case';
import { SubmitBuylistProposalUseCase } from '@/lib/application/use-cases/submit-buylist-proposal.use-case';
import { ProcessBuylistProposalUseCase } from '@/lib/application/use-cases/process-buylist-proposal.use-case';
import type { IBuylistRepository } from '@/lib/domain/repositories/buylist.repository';
import type { IInventoryRepository } from '@/lib/domain/repositories/inventory.repository';
import type { ICustomerRepository } from '@/lib/domain/repositories/customer.repository';
import type { ICustomerCreditLedgerRepository } from '@/lib/domain/repositories/customer-credit-ledger.repository';

describe('Buylist Use Cases', () => {
  let buylistRepo: MockProxy<IBuylistRepository>;
  let inventoryRepo: MockProxy<IInventoryRepository>;
  let customerRepo: MockProxy<ICustomerRepository>;
  let creditRepo: MockProxy<ICustomerCreditLedgerRepository>;

  beforeEach(() => {
    buylistRepo = mock<IBuylistRepository>();
    inventoryRepo = mock<IInventoryRepository>();
    customerRepo = mock<ICustomerRepository>();
    creditRepo = mock<ICustomerCreditLedgerRepository>();
    vi.clearAllMocks();
  });

  describe('SaveBuylistItemUseCase', () => {
    it('should save buylist item correctly', async () => {
      const useCase = new SaveBuylistItemUseCase(buylistRepo);
      const input = {
        id: "",
        tenantId: "t1",
        cardTemplateId: "tmpl-1",
        priceCash: 10,
        priceCredit: 12,
        active: true,
      };

      await useCase.execute(input);

      expect(buylistRepo.saveItem).toHaveBeenCalledWith(expect.objectContaining({
        cardTemplateId: "tmpl-1",
        priceCash: 10,
      }));
    });
  });

  describe('SubmitBuylistProposalUseCase', () => {
    it('should calculate totals and save proposal', async () => {
      const useCase = new SubmitBuylistProposalUseCase(buylistRepo);
      const input = {
        tenantId: "t1",
        customerId: "c1",
        items: [
          { cardTemplateId: "tmpl-1", quantity: 2, condition: "NM", language: "PT", priceCash: 10, priceCredit: 12 },
          { cardTemplateId: "tmpl-2", quantity: 1, condition: "SP", language: "EN", priceCash: 5, priceCredit: 6 },
        ]
      };

      await useCase.execute(input);

      expect(buylistRepo.saveProposal).toHaveBeenCalledWith(expect.objectContaining({
        totalCash: 25, // (2 * 10) + (1 * 5)
        totalCredit: 30, // (2 * 12) + (1 * 6)
        status: "PENDING"
      }));
    });
  });

  describe('ProcessBuylistProposalUseCase', () => {
    it('should approve proposal and update inventory and credit', async () => {
      const useCase = new ProcessBuylistProposalUseCase(buylistRepo, inventoryRepo, customerRepo, creditRepo);
      
      const mockProposal = {
        id: "p1",
        tenantId: "t1",
        customerId: "c1",
        status: "PENDING",
        totalCash: 100,
        totalCredit: 130,
        items: [
          { cardTemplateId: "tmpl-1", quantity: 5, condition: "NM", language: "PT", priceCash: 20, priceCredit: 26 }
        ]
      };

      buylistRepo.findProposalById.mockResolvedValue(mockProposal as any);
      customerRepo.findById.mockResolvedValue({ id: "c1", creditBalance: 0 } as any);
      inventoryRepo.findAllActive.mockResolvedValue([]);

      await useCase.execute({
        proposalId: "p1",
        action: "APPROVE",
        paymentMethod: "STORE_CREDIT"
      });

      // Assert status updated
      expect(buylistRepo.updateProposalStatus).toHaveBeenCalledWith("p1", "PAID", undefined);
      
      // Assert inventory updated
      expect(inventoryRepo.findAllActive).toHaveBeenCalledWith("t1");
      
      // Assert credit added (since paymentMethod is STORE_CREDIT)
      expect(customerRepo.update).toHaveBeenCalledWith("c1", expect.objectContaining({ creditBalance: 130 }));
      expect(creditRepo.save).toHaveBeenCalled();
    });

    it('should cancel proposal without updates', async () => {
      const useCase = new ProcessBuylistProposalUseCase(buylistRepo, inventoryRepo, customerRepo, creditRepo);
      
      buylistRepo.findProposalById.mockResolvedValue({ id: "p1", status: "PENDING" } as any);

      await useCase.execute({
        proposalId: "p1",
        action: "CANCEL",
        paymentMethod: "CASH" // Required by interface even if not used for CANCEL
      });

      expect(buylistRepo.updateProposalStatus).toHaveBeenCalledWith("p1", "CANCELLED", undefined);
      expect(inventoryRepo.save).not.toHaveBeenCalled();
      expect(customerRepo.update).not.toHaveBeenCalled();
    });

    it('should throw error if proposal not found', async () => {
      const useCase = new ProcessBuylistProposalUseCase(buylistRepo, inventoryRepo, customerRepo, creditRepo);
      buylistRepo.findProposalById.mockResolvedValue(null);

      await expect(useCase.execute({
        proposalId: "missing",
        action: "APPROVE",
        paymentMethod: "CASH"
      })).rejects.toThrow('Proposta não encontrada.');
    });

    it('should throw error if proposal is not pending', async () => {
      const useCase = new ProcessBuylistProposalUseCase(buylistRepo, inventoryRepo, customerRepo, creditRepo);
      buylistRepo.findProposalById.mockResolvedValue({ id: "p1", status: "PAID" } as any);

      await expect(useCase.execute({
        proposalId: "p1",
        action: "APPROVE",
        paymentMethod: "CASH"
      })).rejects.toThrow('Apenas propostas pendentes podem ser processadas.');
    });
  });
});
