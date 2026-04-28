import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListUsersUseCase } from '@/lib/application/use-cases/users/list-users.use-case';

const listUsers = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    auth: { admin: { listUsers: (...a: unknown[]) => listUsers(...a) } },
  },
}));

vi.mock('@/lib/tenant-context', () => ({
  getTenantId: vi.fn(() => 'test-tenant-id'),
  resolveTenantId: vi.fn(async () => 'test-tenant-id'),
}));

describe('ListUsersUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should filter users by tenantId from app_metadata', async () => {
    listUsers.mockResolvedValue({
      data: {
        users: [
          { id: '1', email: 'a@test.com', created_at: new Date().toISOString(), app_metadata: { tenantId: 'test-tenant-id', role: 'ADMIN' } },
          { id: '2', email: 'b@test.com', created_at: new Date().toISOString(), app_metadata: { tenantId: 'other-tenant', role: 'USER' } },
          { id: '3', email: 'c@test.com', created_at: new Date().toISOString(), app_metadata: { tenantId: 'test-tenant-id', role: 'USER' } },
        ],
      },
      error: null,
    });

    const useCase = new ListUsersUseCase();
    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.items).toHaveLength(2);
    expect(result.items.every((u) => u.id !== '2')).toBe(true);
    expect(result.total).toBe(2);
  });

  it('should filter by search term against email', async () => {
    listUsers.mockResolvedValue({
      data: {
        users: [
          { id: '1', email: 'admin@test.com', created_at: new Date().toISOString(), app_metadata: { tenantId: 'test-tenant-id', role: 'ADMIN' } },
          { id: '2', email: 'user@test.com', created_at: new Date().toISOString(), app_metadata: { tenantId: 'test-tenant-id', role: 'USER' } },
        ],
      },
      error: null,
    });

    const useCase = new ListUsersUseCase();
    const result = await useCase.execute({ page: 1, limit: 10, search: 'admin' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].email).toBe('admin@test.com');
  });

  it('should calculate pageCount correctly', async () => {
    listUsers.mockResolvedValue({
      data: {
        users: Array.from({ length: 25 }, (_, i) => ({
          id: String(i),
          email: `user${i}@test.com`,
          created_at: new Date().toISOString(),
          app_metadata: { tenantId: 'test-tenant-id', role: 'USER' },
        })),
      },
      error: null,
    });

    const useCase = new ListUsersUseCase();
    const result = await useCase.execute({ page: 1, limit: 10 });
    expect(result.pageCount).toBe(3);
    expect(result.total).toBe(25);
    expect(result.items).toHaveLength(10);
  });

  it('should handle empty results', async () => {
    listUsers.mockResolvedValue({ data: { users: [] }, error: null });

    const useCase = new ListUsersUseCase();
    const result = await useCase.execute({ page: 1, limit: 10 });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });

  it('should throw when supabase returns error', async () => {
    listUsers.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const useCase = new ListUsersUseCase();
    await expect(useCase.execute({ page: 1, limit: 10 })).rejects.toThrow('boom');
  });
});
