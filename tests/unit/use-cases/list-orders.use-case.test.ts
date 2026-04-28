import { describe, it, expect, beforeEach } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { ListOrdersUseCase } from '@/lib/application/use-cases/orders/list-orders.use-case';
import type { IOrderRepository } from '@/lib/domain/repositories/order.repository';

describe('ListOrdersUseCase', () => {
  let useCase: ListOrdersUseCase;
  let orderRepo: MockProxy<IOrderRepository>;

  beforeEach(() => {
    orderRepo = mock<IOrderRepository>();
    useCase = new ListOrdersUseCase(orderRepo);
  });

  it('should list orders with pagination correctly', async () => {
    // Arrange
    const mockOrders = [
      { id: '1', totalAmount: 100, status: 'COMPLETED' },
      { id: '2', totalAmount: 200, status: 'PENDING' },
    ];
    orderRepo.findPaginated.mockResolvedValue({
      items: mockOrders as any,
      total: 2,
    });

    const request = {
      page: 1,
      limit: 10,
      filters: { status: 'all' as const }
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.pageCount).toBe(1);
    expect(orderRepo.findPaginated).toHaveBeenCalledWith(1, 10, request.filters);
  });

  it('should calculate pageCount correctly', async () => {
    // Arrange
    orderRepo.findPaginated.mockResolvedValue({
      items: [],
      total: 25,
    });

    // Act
    const result = await useCase.execute({ page: 1, limit: 10, filters: {} });

    // Assert
    expect(result.pageCount).toBe(3);
  });
});
