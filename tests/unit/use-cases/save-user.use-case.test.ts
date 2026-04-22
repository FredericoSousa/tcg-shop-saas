import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveUserUseCase } from '@/lib/application/use-cases/save-user.use-case';

const createUser = vi.fn();
const updateUserById = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    auth: { admin: { createUser: (...a: unknown[]) => createUser(...a), updateUserById: (...a: unknown[]) => updateUserById(...a) } },
  },
}));

vi.mock('@/lib/tenant-context', () => ({
  getTenantId: vi.fn(() => 'test-tenant-id'),
}));

const VALID_USER_ID = '11111111-1111-4111-8111-111111111111';
const VALID_PASSWORD = 'StrongP@ss1';
const VALID_NEW_PASSWORD = 'NewValidP@ss2';
const VALID_EMAIL = 'user1@example.com';

describe('SaveUserUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Creation', () => {
    it('should create new user with app_metadata tenantId and role', async () => {
      createUser.mockResolvedValue({
        data: { user: { id: 'u1', email: VALID_EMAIL, app_metadata: { role: 'ADMIN', tenantId: 'test-tenant-id' } } },
        error: null,
      });

      const useCase = new SaveUserUseCase();
      const result = await useCase.execute({ email: VALID_EMAIL, password: VALID_PASSWORD, role: 'ADMIN' });

      expect(createUser).toHaveBeenCalledWith(expect.objectContaining({
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
        email_confirm: true,
        app_metadata: { tenantId: 'test-tenant-id', role: 'ADMIN' },
      }));
      expect(result).toEqual({ id: 'u1', email: VALID_EMAIL, role: 'ADMIN' });
    });

    it('should throw error if password is missing for new user', async () => {
      const useCase = new SaveUserUseCase();
      await expect(useCase.execute({ email: VALID_EMAIL }))
        .rejects.toThrow('Senha é obrigatória para novos usuários.');
    });

    it('should propagate supabase errors', async () => {
      createUser.mockResolvedValue({ data: { user: null }, error: { message: 'already registered' } });
      const useCase = new SaveUserUseCase();
      await expect(useCase.execute({ email: VALID_EMAIL, password: VALID_PASSWORD }))
        .rejects.toThrow('already registered');
    });

    it('should default role to USER when not provided', async () => {
      createUser.mockResolvedValue({
        data: { user: { id: 'u1', email: VALID_EMAIL, app_metadata: { role: 'USER', tenantId: 'test-tenant-id' } } },
        error: null,
      });

      const useCase = new SaveUserUseCase();
      await useCase.execute({ email: VALID_EMAIL, password: VALID_PASSWORD });

      expect(createUser).toHaveBeenCalledWith(expect.objectContaining({
        app_metadata: { tenantId: 'test-tenant-id', role: 'USER' },
      }));
    });

    it('should reject weak passwords', async () => {
      const useCase = new SaveUserUseCase();
      await expect(useCase.execute({ email: VALID_EMAIL, password: '123' }))
        .rejects.toThrow();
    });

    it('should reject invalid emails', async () => {
      const useCase = new SaveUserUseCase();
      await expect(useCase.execute({ email: 'not-an-email', password: VALID_PASSWORD }))
        .rejects.toThrow();
    });
  });

  describe('Update', () => {
    it('should update existing user without changing password', async () => {
      updateUserById.mockResolvedValue({
        data: { user: { id: VALID_USER_ID, email: VALID_EMAIL, app_metadata: { role: 'ADMIN', tenantId: 'test-tenant-id' } } },
        error: null,
      });

      const useCase = new SaveUserUseCase();
      await useCase.execute({ id: VALID_USER_ID, email: VALID_EMAIL, role: 'ADMIN' });

      expect(updateUserById).toHaveBeenCalledWith(VALID_USER_ID, expect.objectContaining({
        email: VALID_EMAIL,
        app_metadata: { tenantId: 'test-tenant-id', role: 'ADMIN' },
      }));
      expect(updateUserById.mock.calls[0][1]).not.toHaveProperty('password');
    });

    it('should update existing user and set new password if provided', async () => {
      updateUserById.mockResolvedValue({
        data: { user: { id: VALID_USER_ID, email: VALID_EMAIL, app_metadata: { role: 'USER', tenantId: 'test-tenant-id' } } },
        error: null,
      });

      const useCase = new SaveUserUseCase();
      await useCase.execute({ id: VALID_USER_ID, email: VALID_EMAIL, password: VALID_NEW_PASSWORD });

      expect(updateUserById).toHaveBeenCalledWith(VALID_USER_ID, expect.objectContaining({
        password: VALID_NEW_PASSWORD,
      }));
    });
  });
});
