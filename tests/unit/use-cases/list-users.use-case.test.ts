import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { ListUsersUseCase } from '@/lib/application/use-cases/list-users.use-case';
import type { IUserRepository } from '@/lib/domain/repositories/user.repository';

describe('ListUsersUseCase', () => {
  let userRepo: MockProxy<IUserRepository>;

  beforeEach(() => {
    userRepo = mock<IUserRepository>();
    vi.clearAllMocks();
  });

  it('should list users with pagination and search', async () => {
    const useCase = new ListUsersUseCase(userRepo);
    const mockUsers = [
      { id: '1', username: 'user1', role: 'ADMIN', createdAt: new Date() },
      { id: '2', username: 'user2', role: 'USER', createdAt: new Date() },
    ];
    userRepo.findPaginated.mockResolvedValue({ 
      items: mockUsers as any, 
      total: 2 
    });

    const result = await useCase.execute({ page: 1, limit: 10, search: 'user' });

    expect(userRepo.findPaginated).toHaveBeenCalledWith(1, 10, 'user');
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.pageCount).toBe(1);
    expect(result.items[0]).not.toHaveProperty('passwordHash');
  });

  it('should calculate pageCount correctly', async () => {
    const useCase = new ListUsersUseCase(userRepo);
    userRepo.findPaginated.mockResolvedValue({ items: [], total: 25 });

    const result = await useCase.execute({ page: 1, limit: 10 });
    expect(result.pageCount).toBe(3);
  });

  it('should handle empty results', async () => {
    const useCase = new ListUsersUseCase(userRepo);
    userRepo.findPaginated.mockResolvedValue({ items: [], total: 0 });

    const result = await useCase.execute({ page: 1, limit: 10 });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(1);
  });
});
