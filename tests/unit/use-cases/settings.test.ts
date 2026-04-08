import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { UpdateSettingsUseCase, ListUsersUseCase, SaveUserUseCase } from '@/lib/application/use-cases/settings-users.use-case';
import type { ITenantRepository, IUserRepository } from '@/lib/domain/repositories/tenant.repository';

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
    it('should list all users', async () => {
      const useCase = new ListUsersUseCase(userRepo);
      userRepo.findAll.mockResolvedValue([]);
      await useCase.execute();
      expect(userRepo.findAll).toHaveBeenCalled();
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
