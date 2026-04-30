import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { PlaceOrderUseCase } from '@/lib/application/use-cases/orders/place-order.use-case';
import type { IOrderRepository } from '@/lib/domain/repositories/order.repository';
import type { IInventoryRepository } from '@/lib/domain/repositories/inventory.repository';
import type { IProductRepository } from '@/lib/domain/repositories/product.repository';
import type { ICustomerRepository } from '@/lib/domain/repositories/customer.repository';

const enqueueMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback({})),
  },
}));

vi.mock('@/lib/tenant-context', () => ({
  getTenantId: vi.fn(() => 'test-tenant-id'),
}));

vi.mock('@/lib/domain/events/outbox-publisher', () => ({
  enqueueDomainEvent: (...args: unknown[]) => enqueueMock(...args),
}));

describe('PlaceOrderUseCase', () => {
  let useCase: PlaceOrderUseCase;
  let orderRepo: MockProxy<IOrderRepository>;
  let inventoryRepo: MockProxy<IInventoryRepository>;
  let productRepo: MockProxy<IProductRepository>;
  let customerRepo: MockProxy<ICustomerRepository>;

  beforeEach(() => {
    orderRepo = mock<IOrderRepository>();
    inventoryRepo = mock<IInventoryRepository>();
    productRepo = mock<IProductRepository>();
    customerRepo = mock<ICustomerRepository>();
    useCase = new PlaceOrderUseCase(orderRepo, inventoryRepo, productRepo, customerRepo);
    vi.clearAllMocks();
  });

  it('places an order with inventory items and decrements stock atomically', async () => {
    customerRepo.upsert.mockResolvedValue({ id: 'c-1' } as any);
    orderRepo.save.mockResolvedValue({ id: 'o-1' } as any);

    const result = await useCase.execute({
      items: [{ inventoryId: 'ii-1', quantity: 1, price: 100 }],
      customerData: { phoneNumber: '11999999999', name: 'João Silva' },
    });

    expect(result.orderId).toBe('o-1');
    expect(customerRepo.upsert).toHaveBeenCalledWith(
      '11999999999',
      { name: 'João Silva', email: undefined },
      expect.any(Object),
    );
    expect(orderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ totalAmount: 100, source: 'ECOMMERCE', status: 'PENDING' }),
      expect.arrayContaining([
        expect.objectContaining({ inventoryItemId: 'ii-1', quantity: 1, priceAtPurchase: 100 }),
      ]),
      expect.any(Object),
    );
    expect(inventoryRepo.decrementStock).toHaveBeenCalledWith('ii-1', 1, expect.any(Object));
  });

  it('places an order with product items and decrements product stock', async () => {
    customerRepo.upsert.mockResolvedValue({ id: 'c-2' } as any);
    orderRepo.save.mockResolvedValue({ id: 'o-2' } as any);

    const result = await useCase.execute({
      items: [{ productId: 'prod-1', quantity: 2, price: 49.99 }],
      customerData: { phoneNumber: '11888888888' },
    });

    expect(result.orderId).toBe('o-2');
    expect(productRepo.decrementStock).toHaveBeenCalledWith('prod-1', 2, expect.any(Object));
  });

  it('calculates total amount correctly across mixed item types', async () => {
    customerRepo.upsert.mockResolvedValue({ id: 'c-3' } as any);
    orderRepo.save.mockResolvedValue({ id: 'o-3' } as any);

    await useCase.execute({
      items: [
        { productId: 'p1', quantity: 2, price: 15 },
        { productId: 'p2', quantity: 1, price: 25 },
        { inventoryId: 'i1', quantity: 4, price: 5 },
      ],
      customerData: { phoneNumber: '11666666666' },
    });

    expect(orderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ totalAmount: 75 }),
      expect.anything(),
      expect.any(Object),
    );
  });

  it('enqueues an ORDER_PLACED outbox event inside the transaction', async () => {
    customerRepo.upsert.mockResolvedValue({ id: 'c-5' } as any);
    orderRepo.save.mockResolvedValue({ id: 'o-5' } as any);

    await useCase.execute({
      items: [{ inventoryId: 'ii-1', quantity: 1, price: 10 }],
      customerData: { phoneNumber: '11555555555' },
    });

    expect(enqueueMock).toHaveBeenCalledWith(
      'order.placed',
      expect.objectContaining({ orderId: 'o-5' }),
      'test-tenant-id',
      expect.any(Object),
    );
  });
});
