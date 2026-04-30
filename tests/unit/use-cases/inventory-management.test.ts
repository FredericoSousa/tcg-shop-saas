import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { AddInventoryUseCase } from '@/lib/application/use-cases/inventory/add-inventory.use-case';
import { UpdateInventoryUseCase } from '@/lib/application/use-cases/inventory/update-inventory.use-case';
import { BulkUpdateInventoryUseCase } from '@/lib/application/use-cases/inventory/bulk-update-inventory.use-case';
import { DeleteInventoryUseCase } from '@/lib/application/use-cases/inventory/delete-inventory.use-case';
import { GetInventoryItemUseCase } from '@/lib/application/use-cases/inventory/get-inventory-item.use-case';
import { ListInventoryUseCase } from '@/lib/application/use-cases/inventory/list-inventory.use-case';
import type { IInventoryRepository, ICardTemplateRepository } from '@/lib/domain/repositories/inventory.repository';
import type { IAuditLogRepository } from '@/lib/domain/repositories/audit-log.repository';
import { domainEvents, DOMAIN_EVENTS } from '@/lib/domain/events/domain-events';

vi.mock('@/lib/domain/events/domain-events', () => ({
  domainEvents: {
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn(),
  },
  DOMAIN_EVENTS: {
    INVENTORY_UPDATED: 'inventory.updated',
    INVENTORY_DELETED: 'inventory.deleted',
  }
}));

// Mock scryfall
vi.mock('@/lib/scryfall', () => ({
  scryfall: {
    getCardById: vi.fn(),
  },
}));

vi.mock('@/lib/tenant-context', () => ({
  getTenantId: vi.fn(() => 'test-tenant-id'),
}));

describe('Inventory Management Use Cases', () => {
  let inventoryRepo: MockProxy<IInventoryRepository>;
  let templateRepo: MockProxy<ICardTemplateRepository>;

  beforeEach(() => {
    inventoryRepo = mock<IInventoryRepository>();
    templateRepo = mock<ICardTemplateRepository>();
    vi.clearAllMocks();
  });

  describe('AddInventoryUseCase', () => {
    it('should add new inventory item if it does not exist', async () => {
      const useCase = new AddInventoryUseCase(inventoryRepo, templateRepo);
      templateRepo.findById.mockResolvedValue({ id: 'tmpl-1' } as any);
      inventoryRepo.findByTemplate.mockResolvedValue(null);

      await useCase.execute({
        scryfallId: 'tmpl-1',
        price: 10,
        quantity: 5,
        condition: 'NEAR_MINT',
        language: 'EN'
      });

      expect(inventoryRepo.save).toHaveBeenCalled();
      expect(domainEvents.publish).toHaveBeenCalledWith(DOMAIN_EVENTS.INVENTORY_UPDATED, expect.objectContaining({
        cardIds: ['tmpl-1'],
        tenantId: 'test-tenant-id'
      }));
    });

    it('should increment quantity if inventory item exists', async () => {
      const useCase = new AddInventoryUseCase(inventoryRepo, templateRepo);
      templateRepo.findById.mockResolvedValue({ id: 'tmpl-1' } as any);
      inventoryRepo.findByTemplate.mockResolvedValue({ id: 'inv-1', quantity: 5 } as any);

      await useCase.execute({
        scryfallId: 'tmpl-1',
        price: 10,
        quantity: 5,
        condition: 'NEAR_MINT',
        language: 'EN'
      });

      expect(inventoryRepo.update).toHaveBeenCalledWith('inv-1', { quantity: 10, active: true });
    });

    it('should fetch template from Scryfall if it does not exist in DB', async () => {
      const useCase = new AddInventoryUseCase(inventoryRepo, templateRepo);
      templateRepo.findById.mockResolvedValue(null);
      
      const { scryfall } = await import('@/lib/scryfall');
      (scryfall.getCardById as any).mockResolvedValue({
        id: 'scry-1',
        name: 'New Card',
        set: 'SET',
        image_uris: { normal: 'url' }
      });

      templateRepo.save.mockResolvedValue({ id: 'scry-1', name: 'New Card' } as any);
      inventoryRepo.findByTemplate.mockResolvedValue(null);

      await useCase.execute({
        scryfallId: 'scry-1',
        price: 10,
        quantity: 5,
        condition: 'NEAR_MINT',
        language: 'EN'
      });

      expect(scryfall.getCardById).toHaveBeenCalledWith('scry-1');
      expect(templateRepo.save).toHaveBeenCalled();
      expect(inventoryRepo.save).toHaveBeenCalled();
    });

    it('should throw error if card not found in Scryfall', async () => {
      const useCase = new AddInventoryUseCase(inventoryRepo, templateRepo);
      templateRepo.findById.mockResolvedValue(null);
      
      const { scryfall } = await import('@/lib/scryfall');
      (scryfall.getCardById as any).mockResolvedValue(null);

      await expect(useCase.execute({
        scryfallId: 'missing',
        price: 10,
        quantity: 1,
        condition: 'NM',
        language: 'EN'
      })).rejects.toThrow(/CardTemplate with ID missing not found/);
    });
  });

  describe('UpdateInventoryUseCase', () => {
    it('should update inventory correctly', async () => {
      const useCase = new UpdateInventoryUseCase(inventoryRepo);
      await useCase.execute({ id: 'inv-1', price: 15 });
      expect(inventoryRepo.update).toHaveBeenCalledWith('inv-1', { price: 15, quantity: undefined });
      expect(domainEvents.publish).toHaveBeenCalledWith(DOMAIN_EVENTS.INVENTORY_UPDATED, expect.objectContaining({
        inventoryIds: ['inv-1'],
        tenantId: 'test-tenant-id'
      }));
    });
  });

  describe('BulkUpdateInventoryUseCase', () => {
    it('should update multiple items', async () => {
      const useCase = new BulkUpdateInventoryUseCase(inventoryRepo);
      await useCase.execute({ ids: ['1', '2'], quantity: 10 });
      expect(inventoryRepo.updateMany).toHaveBeenCalledWith(['1', '2'], { price: undefined, quantity: 10 });
      expect(domainEvents.publish).toHaveBeenCalledWith(DOMAIN_EVENTS.INVENTORY_UPDATED, expect.objectContaining({
        inventoryIds: ['1', '2'],
        tenantId: 'test-tenant-id'
      }));
    });
  });

  describe('DeleteInventoryUseCase', () => {
    it('should delete multiple items and audit each one', async () => {
      const auditLog = mock<IAuditLogRepository>();
      const useCase = new DeleteInventoryUseCase(inventoryRepo, auditLog);
      await useCase.execute({ ids: ['1', '2'], actorId: 'u1' });
      expect(inventoryRepo.deactivateMany).toHaveBeenCalledWith(['1', '2']);
      expect(auditLog.record).toHaveBeenCalledTimes(2);
      expect(domainEvents.publish).toHaveBeenCalledWith(DOMAIN_EVENTS.INVENTORY_DELETED, expect.objectContaining({
        inventoryIds: ['1', '2'],
        tenantId: 'test-tenant-id'
      }));
    });
  });

  describe('GetInventoryItemUseCase', () => {
    it('should return item if found and belongs to tenant', async () => {
      const useCase = new GetInventoryItemUseCase(inventoryRepo);
      inventoryRepo.findById.mockResolvedValue({ id: 'inv-1', tenantId: 't1' } as any);
      
      const result = await useCase.execute({ id: 'inv-1', tenantId: 't1' });
      expect(result?.id).toBe('inv-1');
    });

    it('should return null if item belongs to another tenant', async () => {
      const useCase = new GetInventoryItemUseCase(inventoryRepo);
      inventoryRepo.findById.mockResolvedValue({ id: 'inv-1', tenantId: 'other' } as any);
      
      const result = await useCase.execute({ id: 'inv-1', tenantId: 't1' });
      expect(result).toBeNull();
    });
  });

  describe('ListInventoryUseCase', () => {
    it('should return paginated items', async () => {
      const useCase = new ListInventoryUseCase(inventoryRepo);
      inventoryRepo.findPaginated.mockResolvedValue({ items: [], total: 50 });
      
      const result = await useCase.execute({ page: 1, limit: 10 });
      expect(result.pageCount).toBe(5);
    });
  });
});
