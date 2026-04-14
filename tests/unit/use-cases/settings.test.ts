import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { UpdateSettingsUseCase } from '@/lib/application/use-cases/update-settings.use-case';
import { ListUsersUseCase } from '@/lib/application/use-cases/list-users.use-case';
import { SaveUserUseCase } from '@/lib/application/use-cases/save-user.use-case';
import type { ITenantRepository } from '@/lib/domain/repositories/tenant.repository';
import type { IUserRepository } from '@/lib/domain/repositories/user.repository';

vi.mock('@/lib/auth', () => ({
  hashPassword: vi.fn(() => Promise.resolve('hashed-password')),
}));

vi.mock('../../tenant-context', () => ({
  getTenantId: vi.fn(() => 'test-tenant-id'),
}));

describe('Settings & User Use Cases', () => {
  let tenantRepo: MockProxy<ITenantRepository>;
  let userRepo: MockProxy<IUserRepository>;

  beforeEach(() => {
    tenantRepo = mock<ITenantRepository>();
    userRepo = mock<IUserRepository>();
    vi.clearAllMocks();
  });

  describe('UpdateSettingsUseCase', () => {
    it('should update tenant settings', async () => {
      const useCase = new UpdateSettingsUseCase(tenantRepo);
      await useCase.execute({ id: 't1', data: { name: 'New Name' } });
      expect(tenantRepo.update).toHaveBeenCalledWith('t1', { name: 'New Name' });
    });
  });

  describe('ListUsersUseCase', () => {
    it('should list users with pagination', async () => {
      const useCase = new ListUsersUseCase(userRepo);
      userRepo.findPaginated.mockResolvedValue({ items: [], total: 0 });
      await useCase.execute({ page: 1, limit: 10 });
      expect(userRepo.findPaginated).toHaveBeenCalledWith(1, 10, undefined);
    });
  });

  describe('SaveUserUseCase', () => {
    it('should create new user', async () => {
      const useCase = new SaveUserUseCase(userRepo);
      userRepo.findByUsername.mockResolvedValue(null);
      userRepo.save.mockResolvedValue({ id: 'u1', username: 'u1', role: 'ADMIN' } as any);
      await useCase.execute({ username: 'u1', password: 'p1', role: 'ADMIN' });
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should update existing user', async () => {
      const useCase = new SaveUserUseCase(userRepo);
      userRepo.update.mockResolvedValue({ id: 'u1', username: 'u1-new', role: 'USER' } as any);
      await useCase.execute({ id: 'u1', username: 'u1-new' });
      expect(userRepo.update).toHaveBeenCalledWith('u1', expect.anything());
    });
  });
});
