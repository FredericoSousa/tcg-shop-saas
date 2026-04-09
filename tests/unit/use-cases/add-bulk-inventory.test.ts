import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { AddBulkInventoryUseCase } from '@/lib/application/use-cases/add-bulk-inventory.use-case';
import type { IInventoryRepository, ICardTemplateRepository } from '@/lib/domain/repositories/inventory.repository';

// Mock dependencies
vi.mock('@/lib/scryfall', () => ({
  scryfall: {
    getCardsCollection: vi.fn(),
  },
}));

vi.mock('@/lib/tenant-context', () => ({
  getTenantId: vi.fn(() => 'test-tenant-id'),
}));

describe('AddBulkInventoryUseCase', () => {
  let inventoryRepo: MockProxy<IInventoryRepository>;
  let templateRepo: MockProxy<ICardTemplateRepository>;
  let useCase: AddBulkInventoryUseCase;

  beforeEach(() => {
    inventoryRepo = mock<IInventoryRepository>();
    templateRepo = mock<ICardTemplateRepository>();
    useCase = new AddBulkInventoryUseCase(inventoryRepo, templateRepo);
    vi.clearAllMocks();
  });

  it('should process bulk registration efficiently', async () => {
    const request = [
      { scryfallId: 'id-1', quantity: 2, condition: 'NM', language: 'EN', price: 10 },
      { scryfallId: 'id-1', quantity: 3, condition: 'SP', language: 'PT', price: 8 },
      { scryfallId: 'id-2', quantity: 1, condition: 'NM', language: 'EN', price: 20 },
    ];

    // Mock template resolution
    templateRepo.findByIds.mockResolvedValue([
      { id: 'id-1', name: 'Card 1' } as any,
    ]);

    // Mock scryfall for missing id-2
    const { scryfall } = await import('@/lib/scryfall');
    (scryfall.getCardsCollection as any).mockResolvedValue([
      { id: 'id-2', name: 'Card 2', set: 'SET', image_uris: { normal: 'url' } },
    ]);

    // Mock missing templates creation
    templateRepo.createMany.mockResolvedValue(undefined);

    // Mock inventory lookup
    inventoryRepo.findManyByTemplates.mockResolvedValue([
      { id: 'inv-1', cardTemplateId: 'id-1', condition: 'NM', language: 'EN', extras: [], quantity: 5 } as any,
    ]);

    // Execute
    const results = await useCase.execute(request);

    // Verify
    expect(results).toHaveLength(3);
    expect(results.every(r => r.status === 'success')).toBe(true);

    // Verify template lookup
    expect(templateRepo.findByIds).toHaveBeenCalledWith(['id-1', 'id-2']);
    
    // Verify scryfall call for id-2
    expect(scryfall.getCardsCollection).toHaveBeenCalledWith([{ id: 'id-2' }]);

    // Verify template creation
    expect(templateRepo.createMany).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 'id-2', name: 'Card 2' })
    ]));

    // Verify inventory lookup
    expect(inventoryRepo.findManyByTemplates).toHaveBeenCalledWith(['id-1', 'id-2'], 'test-tenant-id');

    // Verify inventory operations
    // id-1 NM EN should be updated (inv-1)
    expect(inventoryRepo.update).toHaveBeenCalledWith('inv-1', expect.objectContaining({ quantity: 7 }));
    
    // id-1 SP PT should be created
    // id-2 NM EN should be created
    expect(inventoryRepo.createMany).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ cardTemplateId: 'id-1', condition: 'SP', language: 'PT' }),
      expect.objectContaining({ cardTemplateId: 'id-2', condition: 'NM', language: 'EN' }),
    ]));
  });

  it('should handle errors when card is not found', async () => {
    const request = [{ scryfallId: 'missing-id', quantity: 1, condition: 'NM', language: 'EN', price: 10 }];

    templateRepo.findByIds.mockResolvedValue([]);
    const { scryfall } = await import('@/lib/scryfall');
    (scryfall.getCardsCollection as any).mockResolvedValue([]);
    inventoryRepo.findManyByTemplates.mockResolvedValue([]);

    const results = await useCase.execute(request);

    expect(results[0].status).toBe('error');
    expect(results[0].error).toBe('Card not found');
  });
});
