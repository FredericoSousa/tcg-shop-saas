import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { POSCheckoutUseCase } from '@/lib/application/use-cases/pos-checkout.use-case';
import type { IOrderRepository } from '@/lib/domain/repositories/order.repository';
import type { IProductRepository } from '@/lib/domain/repositories/product.repository';
import type { ICustomerRepository } from '@/lib/domain/repositories/customer.repository';
import { domainEvents, DOMAIN_EVENTS } from '@/lib/domain/events/domain-events';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback('mock-tx')),
  },
}));

vi.mock('@/lib/tenant-context', () => ({
  getTenantId: vi.fn(() => 'test-tenant-id'),
}));

vi.mock('@/lib/domain/events/domain-events', () => ({
  domainEvents: {
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn(),
  },
  DOMAIN_EVENTS: {
    ORDER_PLACED: 'order.placed',
  }
}));

describe('POSCheckoutUseCase', () => {
  let useCase: POSCheckoutUseCase;
  let orderRepo: MockProxy<IOrderRepository>;
  let productRepo: MockProxy<IProductRepository>;
  let customerRepo: MockProxy<ICustomerRepository>;

  beforeEach(() => {
    orderRepo = mock<IOrderRepository>();
    productRepo = mock<IProductRepository>();
    customerRepo = mock<ICustomerRepository>();
    useCase = new POSCheckoutUseCase(orderRepo, productRepo, customerRepo);
    vi.clearAllMocks();
  });

  it('should create a new POS order correctly', async () => {
    // Arrange
    const request = {
      items: [{ productId: 'p-1', quantity: 2, price: 50 }],
      customerData: { phoneNumber: '987654321', name: 'Jane Doe' }
    };

    customerRepo.upsert.mockResolvedValue({ id: 'c-1' } as any);
    orderRepo.findPendingPOSOrder.mockResolvedValue(null);
    orderRepo.save.mockResolvedValue({ id: 'o-pos-1' } as any);

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.orderId).toBe('o-pos-1');
    expect(orderRepo.save).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'mock-tx');
    expect(domainEvents.publish).toHaveBeenCalledWith(DOMAIN_EVENTS.ORDER_PLACED, expect.objectContaining({
      orderId: 'o-pos-1',
      tenantId: 'test-tenant-id'
    }));
  });

  it('should append to an existing pending POS order', async () => {
    // Arrange
    const request = {
      items: [{ productId: 'p-2', quantity: 1, price: 100 }],
      customerData: { id: 'c-existing' }
    };

    orderRepo.findPendingPOSOrder.mockResolvedValue({ id: 'o-existing' } as any);

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.orderId).toBe('o-existing');
    expect(orderRepo.appendToOrder).toHaveBeenCalledWith('o-existing', expect.anything(), 100, 'mock-tx');
    expect(orderRepo.save).not.toHaveBeenCalled();
    expect(domainEvents.publish).toHaveBeenCalledWith(DOMAIN_EVENTS.ORDER_PLACED, expect.objectContaining({
      orderId: 'o-existing',
      tenantId: 'test-tenant-id'
    }));
  });
});
