import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { SaveUserUseCase } from '@/lib/application/use-cases/save-user.use-case';
import type { IUserRepository } from '@/lib/domain/repositories/user.repository';

vi.mock('@/lib/auth', () => ({
  hashPassword: vi.fn(() => Promise.resolve('hashed-password')),
}));

vi.mock('@/lib/tenant-context', () => ({
  getTenantId: vi.fn(() => 'test-tenant-id'),
}));

describe('SaveUserUseCase', () => {
  let userRepo: MockProxy<IUserRepository>;

  beforeEach(() => {
    userRepo = mock<IUserRepository>();
    vi.clearAllMocks();
  });

  describe('Creation', () => {
    it('should create new user with hashed password', async () => {
      const useCase = new SaveUserUseCase(userRepo);
      userRepo.findByUsername.mockResolvedValue(null);
      userRepo.save.mockResolvedValue({ id: 'u1', username: 'u1', role: 'ADMIN' } as any);
      
      const result = await useCase.execute({ username: 'u1', password: 'password123', role: 'ADMIN' });
      
      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        username: 'u1',
        passwordHash: 'hashed-password',
        role: 'ADMIN',
        tenantId: 'test-tenant-id'
      }));
      expect(result.username).toBe('u1');
    });

    it('should throw error if password is missing for new user', async () => {
      const useCase = new SaveUserUseCase(userRepo);
      await expect(useCase.execute({ username: 'u1' }))
        .rejects.toThrow('Senha é obrigatória para novos usuários.');
    });

    it('should throw error if user already exists', async () => {
      const useCase = new SaveUserUseCase(userRepo);
      userRepo.findByUsername.mockResolvedValue({ id: 'old' } as any);
      
      await expect(useCase.execute({ username: 'u1', password: 'p1' }))
        .rejects.toThrow('Usuário já existe.');
    });

    it('should use USER role by default if not provided', async () => {
      const useCase = new SaveUserUseCase(userRepo);
      userRepo.findByUsername.mockResolvedValue(null);
      userRepo.save.mockResolvedValue({ id: 'u1', username: 'u1', role: 'USER' } as any);
      
      await useCase.execute({ username: 'u1', password: 'p1' });
      
      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        role: 'USER'
      }));
    });
  });

  describe('Update', () => {
    it('should update existing user without changing password', async () => {
      const useCase = new SaveUserUseCase(userRepo);
      userRepo.update.mockResolvedValue({ id: 'u1', username: 'new-name', role: 'ADMIN' } as any);
      
      await useCase.execute({ id: 'u1', username: 'new-name', role: 'ADMIN' });
      
      expect(userRepo.update).toHaveBeenCalledWith('u1', { 
        username: 'new-name', 
        role: 'ADMIN' 
      });
    });

    it('should update existing user and hash new password if provided', async () => {
      const useCase = new SaveUserUseCase(userRepo);
      userRepo.update.mockResolvedValue({ id: 'u1', username: 'u1' } as any);
      
      await useCase.execute({ id: 'u1', username: 'u1', password: 'new-password' });
      
      expect(userRepo.update).toHaveBeenCalledWith('u1', expect.objectContaining({
        passwordHash: 'hashed-password'
      }));
    });
  });
});
