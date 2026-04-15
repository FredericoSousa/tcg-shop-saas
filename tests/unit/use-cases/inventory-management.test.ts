import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { AddInventoryUseCase } from '@/lib/application/use-cases/add-inventory.use-case';
import { UpdateInventoryUseCase } from '@/lib/application/use-cases/update-inventory.use-case';
import { BulkUpdateInventoryUseCase } from '@/lib/application/use-cases/bulk-update-inventory.use-case';
import { DeleteInventoryUseCase } from '@/lib/application/use-cases/delete-inventory.use-case';
import { GetInventoryItemUseCase } from '@/lib/application/use-cases/get-inventory-item.use-case';
import { ListInventoryUseCase } from '@/lib/application/use-cases/list-inventory.use-case';
import type { IInventoryRepository, ICardTemplateRepository } from '@/lib/domain/repositories/inventory.repository';

// Mock scryfall
vi.mock('@/lib/scryfall', () => ({
  scryfall: {
    getCardById: vi.fn(),
  },
}));

vi.mock('../../tenant-context', () => ({
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
      })).rejects.toThrow('Card not found in Scryfall');
    });
  });

  describe('UpdateInventoryUseCase', () => {
    it('should update inventory correctly', async () => {
      const useCase = new UpdateInventoryUseCase(inventoryRepo);
      await useCase.execute({ id: 'inv-1', price: 15 });
      expect(inventoryRepo.update).toHaveBeenCalledWith('inv-1', { price: 15, quantity: undefined });
    });
  });

  describe('BulkUpdateInventoryUseCase', () => {
    it('should update multiple items', async () => {
      const useCase = new BulkUpdateInventoryUseCase(inventoryRepo);
      await useCase.execute({ ids: ['1', '2'], quantity: 10 });
      expect(inventoryRepo.updateMany).toHaveBeenCalledWith(['1', '2'], { price: undefined, quantity: 10 });
    });
  });

  describe('DeleteInventoryUseCase', () => {
    it('should delete multiple items', async () => {
      const useCase = new DeleteInventoryUseCase(inventoryRepo);
      await useCase.execute({ ids: ['1', '2'] });
      expect(inventoryRepo.deactivateMany).toHaveBeenCalledWith(['1', '2']);
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
