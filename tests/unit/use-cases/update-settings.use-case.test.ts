import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { UpdateSettingsUseCase } from '@/lib/application/use-cases/tenant/update-settings.use-case';
import type { ITenantRepository } from '@/lib/domain/repositories/tenant.repository';

describe('UpdateSettingsUseCase', () => {
  let tenantRepo: MockProxy<ITenantRepository>;

  beforeEach(() => {
    tenantRepo = mock<ITenantRepository>();
    vi.clearAllMocks();
  });

  it('should update tenant settings with only allowed fields', async () => {
    const useCase = new UpdateSettingsUseCase(tenantRepo);
    const data = { 
      name: 'New Name', 
      logoUrl: 'http://logo.com',
      invalidField: 'should be ignored'
    } as any;
    
    await useCase.execute({ id: 't1', data });
    
    expect(tenantRepo.update).toHaveBeenCalledWith('t1', { 
      name: 'New Name',
      logoUrl: 'http://logo.com'
    });
  });

  it('should return the updated tenant from repository', async () => {
    const useCase = new UpdateSettingsUseCase(tenantRepo);
    const updatedTenant = { id: 't1', name: 'Updated' } as any;
    tenantRepo.update.mockResolvedValue(updatedTenant);
    
    const result = await useCase.execute({ id: 't1', data: { name: 'Updated' } });
    
    expect(result).toBe(updatedTenant);
  });
});
