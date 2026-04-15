import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { PlaceOrderUseCase } from '@/lib/application/use-cases/place-order.use-case';
import type { IOrderRepository } from '@/lib/domain/repositories/order.repository';
import type { IInventoryRepository } from '@/lib/domain/repositories/inventory.repository';
import type { ICustomerRepository } from '@/lib/domain/repositories/customer.repository';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback()),
  },
}));

vi.mock('../../tenant-context', () => ({
  getTenantId: vi.fn(() => 'test-tenant-id'),
}));

describe('PlaceOrderUseCase', () => {
  let useCase: PlaceOrderUseCase;
  let orderRepo: MockProxy<IOrderRepository>;
  let inventoryRepo: MockProxy<IInventoryRepository>;
  let customerRepo: MockProxy<ICustomerRepository>;

  beforeEach(() => {
    orderRepo = mock<IOrderRepository>();
    inventoryRepo = mock<IInventoryRepository>();
    customerRepo = mock<ICustomerRepository>();
    useCase = new PlaceOrderUseCase(orderRepo, inventoryRepo, customerRepo);
    vi.clearAllMocks();
  });

  it('should place an order correctly', async () => {
    // Arrange
    const request = {
      items: [{ inventoryId: 'ii-1', quantity: 1, price: 100 }],
      customerData: { phoneNumber: '123456789', name: 'John Doe' }
    };

    customerRepo.upsert.mockResolvedValue({ id: 'c-1' } as any);
    orderRepo.save.mockResolvedValue({ id: 'o-1' } as any);

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.orderId).toBe('o-1');
    expect(customerRepo.upsert).toHaveBeenCalledWith('123456789', { name: 'John Doe', email: undefined });
    expect(orderRepo.save).toHaveBeenCalled();
  });
});
