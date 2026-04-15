import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaOrderRepository } from "@/lib/infrastructure/repositories/prisma-order.repository";
import { tenantContext } from "@/lib/tenant-context";

// Mock the prisma dependency
vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma as prismaMock } from "@/lib/prisma";

describe("PrismaOrderRepository", () => {
  let repository: PrismaOrderRepository;
  const tenantId = "tenant_123";

  beforeEach(() => {
    mockReset(prismaMock);
    repository = new PrismaOrderRepository();
    vi.spyOn(tenantContext, "getStore").mockReturnValue(tenantId);
    
    // Manual mock for $transaction to execute callback
    (prismaMock.$transaction as any).mockImplementation((callback: any) => callback(prismaMock));
  });

  it("should find an order by id with all relations mapped", async () => {
    const mockOrder = {
      id: "order_1",
      tenantId,
      customerId: "cust_1",
      totalAmount: new Prisma.Decimal(100),
      status: "COMPLETED",
      source: "POS",
      friendlyId: "ABC-123",
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: { name: "John", phoneNumber: "123" },
      items: [
        {
          id: "oi_1",
          orderId: "order_1",
          productId: "prod_1",
          quantity: 1,
          priceAtPurchase: new Prisma.Decimal(100),
          product: { name: "Booster", imageUrl: "img.png" }
        }
      ],
      payments: []
    };

    (prismaMock.order.findFirst as any).mockResolvedValue(mockOrder);

    const result = await repository.findById("order_1");

    expect(prismaMock.order.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "order_1" }
    }));
    expect(result?.totalAmount).toBe(100);
    expect(result?.items?.[0].product?.name).toBe("Booster");
  });

  it("should save a new order with multiple items", async () => {
    const orderData = {
      id: "",
      tenantId,
      customerId: "cust_1",
      totalAmount: 50,
      status: "PENDING" as any,
      source: "POS" as any,
      friendlyId: "POS-001"
    };

    const items = [
      { productId: "prod_1", quantity: 2, priceAtPurchase: 25 }
    ];

    (prismaMock.order.create as any).mockResolvedValue({
      ...orderData,
      id: "new_order_id",
      totalAmount: new Prisma.Decimal(50),
      customer: { name: "John", phoneNumber: "123" },
      items: []
    });

    const result = await repository.save(orderData as any, items);

    expect(prismaMock.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: "cust_1",
        totalAmount: expect.any(Prisma.Decimal),
        items: {
          create: [
            expect.objectContaining({ productId: "prod_1", quantity: 2 })
          ]
        }
      }),
      include: { customer: true, items: true }
    });
    expect(result.id).toBe("new_order_id");
  });

  it("should find paginated orders with filters", async () => {
    (prismaMock.order.findMany as any).mockResolvedValue([]);
    (prismaMock.order.count as any).mockResolvedValue(0);

    await repository.findPaginated(1, 10, { status: "COMPLETED" as any, source: "STOREFRONT" as any, search: "John" });

    expect(prismaMock.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: "COMPLETED",
        source: "STOREFRONT",
        OR: expect.arrayContaining([
          { customer: { name: { contains: "John", mode: "insensitive" } } }
        ])
      })
    }));
  });

  it("should update order status", async () => {
    await repository.updateStatus("order_1", "CANCELLED");

    expect(prismaMock.order.update).toHaveBeenCalledWith({
      where: { id: "order_1" },
      data: { status: "CANCELLED" }
    });
  });

  it("should append items to an order by creating new or updating existing items", async () => {
    const orderId = "order_1";
    const newItems = [
      { productId: "prod_1", quantity: 1, priceAtPurchase: 10 }
    ];

    // Mock existing item check
    (prismaMock.orderItem.findFirst as any).mockResolvedValue({ id: "oi_1", quantity: 2 });
    (prismaMock.order.update as any).mockResolvedValue({});

    await repository.appendToOrder(orderId, newItems, 10);

    // Should update total amount
    expect(prismaMock.order.update).toHaveBeenCalledWith({
      where: { id: orderId },
      data: { totalAmount: { increment: expect.any(Prisma.Decimal) } }
    });

    // Should update existing item quantity
    expect(prismaMock.orderItem.update).toHaveBeenCalledWith({
      where: { id: "oi_1" },
      data: { quantity: { increment: 1 } }
    });
  });

  it("should return null if order not found by id", async () => {
    (prismaMock.order.findFirst as any).mockResolvedValue(null);
    const result = await repository.findById("non_existent");
    expect(result).toBeNull();
  });

  it("should find a pending POS order for a customer", async () => {
    (prismaMock.order.findFirst as any).mockResolvedValue({ id: "o1", status: "PENDING", source: "POS", totalAmount: new Prisma.Decimal(10) });
    const result = await repository.findPendingPOSOrder("c1");
    expect(result?.id).toBe("o1");
  });

  it("should return null if no pending POS order found", async () => {
    (prismaMock.order.findFirst as any).mockResolvedValue(null);
    const result = await repository.findPendingPOSOrder("c1");
    expect(result).toBeNull();
  });

  it("should save payments for an order", async () => {
    const payments = [{ method: "CASH" as any, amount: 10 }];
    await repository.savePayments("order_1", payments);
    expect(prismaMock.orderPayment.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ method: "CASH", amount: expect.any(Prisma.Decimal) })]
    });
  });

  it("should append items to an order and create new item if it doesn't exist", async () => {
    const orderId = "order_1";
    const newItems = [{ productId: "prod_new", quantity: 1, priceAtPurchase: 5 }];

    (prismaMock.orderItem.findFirst as any).mockResolvedValue(null);
    (prismaMock.order.update as any).mockResolvedValue({});

    await repository.appendToOrder(orderId, newItems, 5);

    expect(prismaMock.orderItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ productId: "prod_new" })
    });
  });

  it("should use external transaction in appendToOrder if provided", async () => {
    const txMock = mockDeep<Prisma.TransactionClient>();
    (txMock.orderItem.findFirst as any).mockResolvedValue(null);
    (txMock.order.update as any).mockResolvedValue({});

    await repository.appendToOrder("o1", [], 0, txMock);

    expect(txMock.order.update).toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("should find paginated orders with customer specific filters", async () => {
    (prismaMock.order.findMany as any).mockResolvedValue([]);
    (prismaMock.order.count as any).mockResolvedValue(0);

    await repository.findPaginated(1, 10, { customerId: "c1", customerPhone: "123" });

    expect(prismaMock.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        customerId: "c1",
        customer: { phoneNumber: "123" }
      })
    }));
  });

  it("should find paginated orders without filters", async () => {
    (prismaMock.order.findMany as any).mockResolvedValue([]);
    (prismaMock.order.count as any).mockResolvedValue(0);

    await repository.findPaginated(1, 10);

    expect(prismaMock.order.findMany).toHaveBeenCalled();
  });

  it("should map order with payments", async () => {
    const mockOrder = {
      id: "o1", status: "PENDING", source: "POS", totalAmount: new Prisma.Decimal(0),
      payments: [{ id: "p1", orderId: "o1", method: "CASH", amount: new Prisma.Decimal(10), createdAt: new Date() }]
    };
    (prismaMock.order.findFirst as any).mockResolvedValue(mockOrder);

    const result = await repository.findById("o1");
    expect(result?.payments).toHaveLength(1);
    expect(result?.payments?.[0].amount).toBe(10);
  });

  it("should map order item with default product name if missing", async () => {
    const mockOrder = {
      id: "o1", status: "PENDING", source: "POS", totalAmount: new Prisma.Decimal(0),
      items: [{ id: "oi1", orderId: "o1", quantity: 1, priceAtPurchase: new Prisma.Decimal(10), product: null }]
    };
    (prismaMock.order.findFirst as any).mockResolvedValue(mockOrder);

    const result = await repository.findById("o1");
    expect(result?.items?.[0].product?.name).toBe("Produto");
  });
});
