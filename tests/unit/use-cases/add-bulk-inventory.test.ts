import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { AddBulkInventoryUseCase } from '@/lib/application/use-cases/add-bulk-inventory.use-case';
import type { IInventoryRepository } from '@/lib/domain/repositories/inventory.repository';
import { CardTemplateService } from '@/lib/domain/services/card-template.service';
import { domainEvents, DOMAIN_EVENTS } from '@/lib/domain/events/domain-events';

// Mock dependencies
vi.mock('@/lib/tenant-context', () => ({
  getTenantId: vi.fn(() => 'test-tenant-id'),
}));

vi.mock('@/lib/domain/events/domain-events', () => ({
  domainEvents: {
    publish: vi.fn().mockResolvedValue(undefined),
  },
  DOMAIN_EVENTS: {
    INVENTORY_UPDATED: 'inventory.updated',
  },
}));

describe('AddBulkInventoryUseCase', () => {
  let inventoryRepo: MockProxy<IInventoryRepository>;
  let templateService: MockProxy<CardTemplateService>;
  let useCase: AddBulkInventoryUseCase;

  beforeEach(() => {
    inventoryRepo = mock<IInventoryRepository>();
    templateService = mock<CardTemplateService>();
    useCase = new AddBulkInventoryUseCase(inventoryRepo, templateService);
    vi.clearAllMocks();
  });

  it('should process bulk registration efficiently', async () => {
    const request = [
      { scryfallId: 'id-1', quantity: 2, condition: 'NM', language: 'EN', price: 10 },
      { scryfallId: 'id-1', quantity: 3, condition: 'SP', language: 'PT', price: 8 },
      { scryfallId: 'id-2', quantity: 1, condition: 'NM', language: 'EN', price: 20 },
    ];

    // Mock template resolution
    templateService.resolveTemplates.mockResolvedValue([
      { id: 'id-1', name: 'Card 1' } as any,
      { id: 'id-2', name: 'Card 2' } as any,
    ]);

    // Mock inventory lookup
    inventoryRepo.findManyByTemplates.mockResolvedValue([
      { id: 'inv-1', cardTemplateId: 'id-1', condition: 'NM', language: 'EN', extras: [], quantity: 5 } as any,
    ]);

    // Execute
    const results = await useCase.execute(request);

    // Verify
    expect(results).toHaveLength(3);
    expect(results.every(r => r.status === 'success')).toBe(true);

    // Verify service call
    expect(templateService.resolveTemplates).toHaveBeenCalledWith(['id-1', 'id-2']);
    
    // Verify inventory lookup
    expect(inventoryRepo.findManyByTemplates).toHaveBeenCalledWith(['id-1', 'id-2'], 'test-tenant-id');

    // Verify inventory operations
    expect(inventoryRepo.update).toHaveBeenCalledWith('inv-1', expect.objectContaining({ quantity: 7 }));
    
    expect(inventoryRepo.createMany).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ cardTemplateId: 'id-1', condition: 'SP', language: 'PT' }),
      expect.objectContaining({ cardTemplateId: 'id-2', condition: 'NM', language: 'EN' }),
    ]));

    // Verify event publishing
    expect(domainEvents.publish).toHaveBeenCalledWith(DOMAIN_EVENTS.INVENTORY_UPDATED, expect.any(Object));
  });

  it('should handle errors when card is not found', async () => {
    const request = [{ scryfallId: 'missing-id', quantity: 1, condition: 'NM', language: 'EN', price: 10 }];

    templateService.resolveTemplates.mockResolvedValue([]);
    inventoryRepo.findManyByTemplates.mockResolvedValue([]);

    const results = await useCase.execute(request);

    expect(results[0].status).toBe('error');
    expect(results[0].error).toBe('Card not found');
  });

  it('should throw error when tenant context is missing', async () => {
    const { getTenantId } = await import('@/lib/tenant-context');
    (getTenantId as any).mockReturnValue(null);

    const request = [{ scryfallId: 'id-1', quantity: 1, condition: 'NM', language: 'EN', price: 10 }];
    
    await expect(useCase.execute(request)).rejects.toThrow('Tenant context not found');
  });
});
