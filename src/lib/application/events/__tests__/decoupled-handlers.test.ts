import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import { recordLedgerOnCreditAdjustment } from '../customer-credit-handlers';
import { invalidateInventoryCacheOnOrderPlaced } from '../inventory-event-handlers';
import type { ICustomerCreditLedgerRepository } from "@/lib/domain/repositories/customer-credit-ledger.repository";
import { CustomerCreditAdjustedPayload, OrderPlacedPayload } from "@/lib/domain/events/event-payloads";
import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";

describe('Decoupled Event Handlers', () => {
  let ledgerRepo: MockProxy<ICustomerCreditLedgerRepository>;

  beforeEach(() => {
    ledgerRepo = mock<ICustomerCreditLedgerRepository>();

    vi.spyOn(container, 'resolve').mockImplementation((token) => {
      if (token === TOKENS.CustomerCreditLedgerRepository) return ledgerRepo;
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
        source: 'MANUAL',
      };

      await recordLedgerOnCreditAdjustment(data);

      expect(ledgerRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        customerId: 'c1',
        amount: 50,
        type: 'CREDIT',
      }));
    });
  });

  describe('InventoryEventHandlers', () => {
    let publishSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      publishSpy = vi.spyOn(domainEvents, 'publish').mockResolvedValue(undefined);
      publishSpy.mockClear();
    });

    it('republishes INVENTORY_UPDATED for inventory items in the order', async () => {
      const data: OrderPlacedPayload = {
        orderId: 'o1',
        customerId: 'c1',
        tenantId: 't1',
        items: [
          { productId: 'p1', quantity: 2, price: 10 },
          { inventoryId: 'i1', quantity: 1, price: 20 },
        ],
      };

      await invalidateInventoryCacheOnOrderPlaced(data);

      expect(publishSpy).toHaveBeenCalledWith(
        DOMAIN_EVENTS.INVENTORY_UPDATED,
        expect.objectContaining({
          tenantId: 't1',
          inventoryIds: ['i1'],
        }),
      );
    });

    it('skips republish when no inventory items are present', async () => {
      const data: OrderPlacedPayload = {
        orderId: 'o1',
        customerId: 'c1',
        tenantId: 't1',
        items: [{ productId: 'p1', quantity: 1, price: 5 }],
      };

      await invalidateInventoryCacheOnOrderPlaced(data);

      expect(publishSpy).not.toHaveBeenCalled();
    });
  });
});
