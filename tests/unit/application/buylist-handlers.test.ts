import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { container } from '@/lib/infrastructure/container';
import { TOKENS } from '@/lib/infrastructure/tokens';
import { 
  updateInventoryOnBuylistApproval, 
  grantCreditOnBuylistApproval 
} from '@/lib/application/events/buylist-handlers';
import type { IInventoryRepository } from '@/lib/domain/repositories/inventory.repository';
import type { ICustomerRepository } from '@/lib/domain/repositories/customer.repository';
import type { ICustomerCreditLedgerRepository } from '@/lib/domain/repositories/customer-credit-ledger.repository';

describe('Buylist Event Handlers', () => {
  let inventoryRepo: MockProxy<IInventoryRepository>;
  let customerRepo: MockProxy<ICustomerRepository>;
  let creditRepo: MockProxy<ICustomerCreditLedgerRepository>;

  beforeEach(() => {
    inventoryRepo = mock<IInventoryRepository>();
    customerRepo = mock<ICustomerRepository>();
    creditRepo = mock<ICustomerCreditLedgerRepository>();

    // Mock container.resolve
    vi.spyOn(container, 'resolve').mockImplementation((token) => {
      if (token === TOKENS.InventoryRepository) return inventoryRepo;
      if (token === TOKENS.CustomerRepository) return customerRepo;
      if (token === TOKENS.CustomerCreditLedgerRepository) return creditRepo;
      return null as any;
    });

    vi.clearAllMocks();
  });

  describe('updateInventoryOnBuylistApproval', () => {
    it('should increment existing inventory item', async () => {
      inventoryRepo.findAllActive.mockResolvedValue([
        { id: 'inv-1', cardTemplateId: 'tmpl-1', condition: 'NM', language: 'PT', quantity: 10 } as any
      ]);

      await updateInventoryOnBuylistApproval({
        proposalId: 'p1',
        paymentMethod: 'CASH',
        tenantId: 't1',
        customerId: 'c1',
        amount: 100,
        items: [
          { cardTemplateId: 'tmpl-1', quantity: 5, condition: 'NM', language: 'PT', priceCash: 20 }
        ]
      });

      expect(inventoryRepo.update).toHaveBeenCalledWith('inv-1', { quantity: 15 });
    });

    it('should create new inventory item if not found', async () => {
      inventoryRepo.findAllActive.mockResolvedValue([]);

      await updateInventoryOnBuylistApproval({
        proposalId: 'p1',
        paymentMethod: 'CASH',
        tenantId: 't1',
        customerId: 'c1',
        amount: 100,
        items: [
          { cardTemplateId: 'tmpl-1', quantity: 5, condition: 'NM', language: 'PT', priceCash: 20 }
        ]
      });

      expect(inventoryRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        cardTemplateId: 'tmpl-1',
        quantity: 5,
        condition: 'NM'
      }));
    });
  });

  describe('grantCreditOnBuylistApproval', () => {
    it('should grant credit if paymentMethod is STORE_CREDIT', async () => {
      customerRepo.findById.mockResolvedValue({ id: 'c1', creditBalance: 50 } as any);

      await grantCreditOnBuylistApproval({
        proposalId: 'p1',
        paymentMethod: 'STORE_CREDIT',
        tenantId: 't1',
        customerId: 'c1',
        amount: 130,
        items: []
      });

      expect(customerRepo.update).toHaveBeenCalledWith('c1', { creditBalance: 180 });
      expect(creditRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        amount: 130,
        type: 'CREDIT'
      }));
    });

    it('should do nothing if paymentMethod is CASH', async () => {
      await grantCreditOnBuylistApproval({
        proposalId: 'p1',
        paymentMethod: 'CASH',
        tenantId: 't1',
        customerId: 'c1',
        amount: 100,
        items: []
      });

      expect(customerRepo.update).not.toHaveBeenCalled();
      expect(creditRepo.save).not.toHaveBeenCalled();
    });
  });
});
