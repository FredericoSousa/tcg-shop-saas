import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import { recordLedgerOnCreditAdjustment, recordLedgerOnOrderPayment } from '../customer-credit-handlers';
import { decrementStockOnOrderPlaced } from '../inventory-event-handlers';
import type { ICustomerCreditLedgerRepository } from "@/lib/domain/repositories/customer-credit-ledger.repository";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { CustomerCreditAdjustedPayload, OrderPaidPayload, OrderPlacedPayload } from "../../../domain/events/event-payloads";

describe('Decoupled Event Handlers', () => {
  let ledgerRepo: MockProxy<ICustomerCreditLedgerRepository>;
  let inventoryRepo: MockProxy<IInventoryRepository>;
  let productRepo: MockProxy<IProductRepository>;

  beforeEach(() => {
    ledgerRepo = mock<ICustomerCreditLedgerRepository>();
    inventoryRepo = mock<IInventoryRepository>();
    productRepo = mock<IProductRepository>();

    vi.spyOn(container, 'resolve').mockImplementation((token) => {
      if (token === TOKENS.CustomerCreditLedgerRepository) return ledgerRepo;
      if (token === TOKENS.InventoryRepository) return inventoryRepo;
      if (token === TOKENS.ProductRepository) return productRepo;
      return {} as unknown;
    });
  });

  describe('CustomerCreditHandlers', () => {
    it('should record ledger on credit adjustment', async () => {
      const data: CustomerCreditAdjustedPayload = {
        tenantId: 't1',
        customerId: 'c1',
        amount: 50,
        newBalance: 150,
        description: 'Test',
        source: 'MANUAL'
      };

      await recordLedgerOnCreditAdjustment(data);

      expect(ledgerRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        customerId: 'c1',
        amount: 50,
        type: 'CREDIT'
      }));
    });

    it('should record ledger on order payment', async () => {
      const data: OrderPaidPayload = {
        tenantId: 't1',
        customerId: 'c1',
        orderId: 'o1',
        totalAmount: 30,
        payments: [{ method: 'STORE_CREDIT', amount: 30 }]
      };

      await recordLedgerOnOrderPayment(data);

      expect(ledgerRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        orderId: 'o1',
        amount: 30,
        type: 'DEBIT'
      }));
    });
  });

  describe('InventoryEventHandlers', () => {
    it('should decrement stock on order placed', async () => {
      const data: OrderPlacedPayload = {
        orderId: 'o1',
        customerId: 'c1',
        items: [
          { productId: 'p1', quantity: 2, price: 10 },
          { inventoryId: 'i1', quantity: 1, price: 20 }
        ]
      };

      await decrementStockOnOrderPlaced(data);

      expect(productRepo.decrementStock).toHaveBeenCalledWith('p1', 2);
      expect(inventoryRepo.decrementStock).toHaveBeenCalledWith('i1', 1);
    });
  });
});
