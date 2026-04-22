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
    BUYLIST_PROPOSAL_APPROVED: 'buylist.proposal_approved',
    BUYLIST_PROPOSAL_SUBMITTED: 'buylist.proposal_submitted',
    BUYLIST_PROPOSAL_REJECTED: 'buylist.proposal_rejected',
    ORDER_PAID: 'order.paid',
    INVENTORY_UPDATED: 'inventory.updated',
    INVENTORY_DELETED: 'inventory.deleted',
    PRODUCT_SAVED: 'product.saved',
    PRODUCT_DELETED: 'product.deleted',
    CUSTOMER_CREDIT_ADJUSTED: 'customer.credit_adjusted',
    CUSTOMER_DELETED: 'customer.deleted',
  },
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

  it('should place an order with inventory items', async () => {
    customerRepo.upsert.mockResolvedValue({ id: 'c-1' } as any);
    customerRepo.findByPhoneNumber.mockResolvedValue({ id: 'c-1' } as any);
    orderRepo.save.mockResolvedValue({ id: 'o-1' } as any);

    const result = await useCase.execute({
      items: [{ inventoryId: 'ii-1', quantity: 1, price: 100 }],
      customerData: { phoneNumber: '11999999999', name: 'João Silva' },
    });

    expect(result.orderId).toBe('o-1');
    expect(customerRepo.upsert).toHaveBeenCalledWith('11999999999', { name: 'João Silva', email: undefined });
    expect(orderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ totalAmount: 100, source: 'ECOMMERCE', status: 'PENDING' }),
      expect.arrayContaining([
        expect.objectContaining({ inventoryItemId: 'ii-1', quantity: 1, priceAtPurchase: 100 }),
      ])
    );
  });

  it('should place an order with product items', async () => {
    customerRepo.upsert.mockResolvedValue({ id: 'c-2' } as any);
    customerRepo.findByPhoneNumber.mockResolvedValue({ id: 'c-2' } as any);
    orderRepo.save.mockResolvedValue({ id: 'o-2' } as any);

    const result = await useCase.execute({
      items: [{ productId: 'prod-1', quantity: 2, price: 49.99 }],
      customerData: { phoneNumber: '11888888888', name: 'Maria Santos' },
    });

    expect(result.orderId).toBe('o-2');
    expect(orderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ totalAmount: 99.98 }),
      expect.arrayContaining([
        expect.objectContaining({ productId: 'prod-1', quantity: 2, priceAtPurchase: 49.99 }),
      ])
    );
  });

  it('should place an order with mixed inventory and product items', async () => {
    customerRepo.upsert.mockResolvedValue({ id: 'c-3' } as any);
    customerRepo.findByPhoneNumber.mockResolvedValue({ id: 'c-3' } as any);
    orderRepo.save.mockResolvedValue({ id: 'o-3' } as any);

    const result = await useCase.execute({
      items: [
        { inventoryId: 'ii-1', quantity: 1, price: 30 },
        { productId: 'prod-1', quantity: 3, price: 10 },
      ],
      customerData: { phoneNumber: '11777777777' },
    });

    expect(result.orderId).toBe('o-3');
    expect(orderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ totalAmount: 60 }),
      expect.arrayContaining([
        expect.objectContaining({ inventoryItemId: 'ii-1', productId: undefined }),
        expect.objectContaining({ productId: 'prod-1', inventoryItemId: undefined }),
      ])
    );
  });

  it('should calculate total amount correctly across multiple items', async () => {
    customerRepo.upsert.mockResolvedValue({ id: 'c-4' } as any);
    customerRepo.findByPhoneNumber.mockResolvedValue({ id: 'c-4' } as any);
    orderRepo.save.mockResolvedValue({ id: 'o-4' } as any);

    await useCase.execute({
      items: [
        { productId: 'p1', quantity: 2, price: 15 },
        { productId: 'p2', quantity: 1, price: 25 },
        { inventoryId: 'i1', quantity: 4, price: 5 },
      ],
      customerData: { phoneNumber: '11666666666' },
    });

    // 2*15 + 1*25 + 4*5 = 75
    expect(orderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ totalAmount: 75 }),
      expect.anything()
    );
  });

  it('should publish ORDER_PLACED event with correct item types', async () => {
    const { domainEvents } = await import('@/lib/domain/events/domain-events');
    customerRepo.upsert.mockResolvedValue({ id: 'c-5' } as any);
    customerRepo.findByPhoneNumber.mockResolvedValue({ id: 'c-5' } as any);
    orderRepo.save.mockResolvedValue({ id: 'o-5' } as any);

    await useCase.execute({
      items: [
        { inventoryId: 'ii-1', quantity: 1, price: 10 },
        { productId: 'prod-1', quantity: 1, price: 20 },
      ],
      customerData: { phoneNumber: '11555555555' },
    });

    expect(domainEvents.publish).toHaveBeenCalledWith(
      'order.placed',
      expect.objectContaining({
        orderId: 'o-5',
        items: expect.arrayContaining([
          expect.objectContaining({ inventoryId: 'ii-1', quantity: 1 }),
          expect.objectContaining({ productId: 'prod-1', quantity: 1 }),
        ]),
      })
    );
  });
});
