import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { SaveBuylistItemUseCase } from '@/lib/application/use-cases/buylist/save-buylist-item.use-case';
import { SubmitBuylistProposalUseCase } from '@/lib/application/use-cases/buylist/submit-buylist-proposal.use-case';
import { ProcessBuylistProposalUseCase } from '@/lib/application/use-cases/buylist/process-buylist-proposal.use-case';
import type { IBuylistRepository } from '@/lib/domain/repositories/buylist.repository';
import type { IInventoryRepository } from '@/lib/domain/repositories/inventory.repository';
import type { ICustomerRepository } from '@/lib/domain/repositories/customer.repository';
import type { ICustomerCreditLedgerRepository } from '@/lib/domain/repositories/customer-credit-ledger.repository';
import { domainEvents, DOMAIN_EVENTS } from '@/lib/domain/events/domain-events';

const enqueueMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/domain/events/domain-events', () => ({
  domainEvents: {
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn(),
  },
  DOMAIN_EVENTS: {
    BUYLIST_PROPOSAL_SUBMITTED: 'buylist.proposal_submitted',
    BUYLIST_PROPOSAL_APPROVED: 'buylist.proposal_approved',
    BUYLIST_PROPOSAL_REJECTED: 'buylist.proposal_rejected',
    INVENTORY_UPDATED: 'inventory.updated',
  }
}));

vi.mock('@/lib/domain/events/outbox-publisher', () => ({
  enqueueDomainEvent: (...args: unknown[]) => enqueueMock(...args),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((fn) => fn({})),
  },
}));

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
      const useCase = new SubmitBuylistProposalUseCase(buylistRepo, customerRepo);
      
      const customerData = {
        phoneNumber: "123456789",
        name: "Test Customer",
        email: "test@example.com"
      };

      customerRepo.upsert.mockResolvedValue({ 
        id: "c1", 
        ...customerData,
        creditBalance: 0,
        tenantId: "t1",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      });

      const input = {
        tenantId: "t1",
        customerData,
        items: [
          { cardTemplateId: "tmpl-1", quantity: 2, condition: "NM", language: "PT", priceCash: 10, priceCredit: 12 },
          { cardTemplateId: "tmpl-2", quantity: 1, condition: "SP", language: "EN", priceCash: 5, priceCredit: 6 },
        ]
      };

      buylistRepo.saveProposal.mockResolvedValue({ 
        id: "p1", 
        tenantId: "t1", 
        customerId: "c1", 
        totalCash: 25, 
        totalCredit: 30 
      } as any);

      await useCase.execute(input);

      expect(customerRepo.upsert).toHaveBeenCalledWith(customerData.phoneNumber, {
        name: customerData.name,
        email: customerData.email
      });

      expect(buylistRepo.saveProposal).toHaveBeenCalledWith(expect.objectContaining({
        totalCash: 25, // (2 * 10) + (1 * 5)
        totalCredit: 30, // (2 * 12) + (1 * 6)
        status: "PENDING",
        customerId: "c1"
      }));

      expect(domainEvents.publish).toHaveBeenCalledWith(DOMAIN_EVENTS.BUYLIST_PROPOSAL_SUBMITTED, expect.objectContaining({
        customerId: "c1"
      }));
    });
  });

  describe('ProcessBuylistProposalUseCase', () => {
    beforeEach(() => {
      enqueueMock.mockClear();
    });

    it('approves proposal, upserts stock and grants credit atomically', async () => {
      const useCase = new ProcessBuylistProposalUseCase(buylistRepo, inventoryRepo, customerRepo, creditRepo);

      const mockProposal = {
        id: "p1",
        tenantId: "t1",
        customerId: "c1",
        status: "PENDING",
        totalCash: 100,
        totalCredit: 130,
        items: [
          { cardTemplateId: "tmpl-1", quantity: 5, condition: "NM", language: "PT", priceCash: 20, priceCredit: 26 },
        ],
      };

      buylistRepo.findProposalById.mockResolvedValue(mockProposal as any);

      await useCase.execute({
        proposalId: "p1",
        action: "APPROVE",
        paymentMethod: "STORE_CREDIT",
      });

      expect(buylistRepo.updateProposalStatus).toHaveBeenCalledWith(
        "p1",
        "PAID",
        undefined,
        expect.any(Object),
      );
      expect(inventoryRepo.upsertStockForBuylist).toHaveBeenCalledWith(
        expect.objectContaining({ cardTemplateId: "tmpl-1", quantity: 5 }),
        expect.any(Object),
      );
      expect(customerRepo.updateCreditBalance).toHaveBeenCalledWith(
        "c1",
        130,
        expect.any(Object),
      );
      expect(creditRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ type: "CREDIT", amount: 130 }),
        expect.any(Object),
      );
      expect(enqueueMock).toHaveBeenCalledWith(
        DOMAIN_EVENTS.BUYLIST_PROPOSAL_APPROVED,
        expect.objectContaining({ proposalId: "p1", paymentMethod: "STORE_CREDIT" }),
        "t1",
        expect.any(Object),
      );
    });

    it('cancels a proposal without touching inventory or balances', async () => {
      const useCase = new ProcessBuylistProposalUseCase(buylistRepo, inventoryRepo, customerRepo, creditRepo);

      buylistRepo.findProposalById.mockResolvedValue({ id: "p1", tenantId: "t1", status: "PENDING" } as any);

      await useCase.execute({
        proposalId: "p1",
        action: "CANCEL",
        paymentMethod: "CASH",
      });

      expect(buylistRepo.updateProposalStatus).toHaveBeenCalledWith(
        "p1",
        "CANCELLED",
        undefined,
        expect.any(Object),
      );
      expect(inventoryRepo.upsertStockForBuylist).not.toHaveBeenCalled();
      expect(customerRepo.updateCreditBalance).not.toHaveBeenCalled();
      expect(creditRepo.save).not.toHaveBeenCalled();
    });

    it('throws an EntityNotFoundError when the proposal is missing', async () => {
      const useCase = new ProcessBuylistProposalUseCase(buylistRepo, inventoryRepo, customerRepo, creditRepo);
      buylistRepo.findProposalById.mockResolvedValue(null);

      await expect(useCase.execute({
        proposalId: "missing",
        action: "APPROVE",
        paymentMethod: "CASH",
      })).rejects.toThrow(/Proposta with ID missing not found/);
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
