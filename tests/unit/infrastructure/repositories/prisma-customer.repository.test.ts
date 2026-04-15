import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, Prisma } from "@prisma/client";

// Mock the prisma dependency
vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma as prismaMock } from "@/lib/prisma";
import { PrismaCustomerRepository } from "@/lib/infrastructure/repositories/prisma-customer.repository";
import { tenantContext } from "@/lib/tenant-context";

describe("PrismaCustomerRepository", () => {
  let repository: PrismaCustomerRepository;
  const tenantId = "tenant_123";

  beforeEach(() => {
    mockReset(prismaMock);
    repository = new PrismaCustomerRepository();
  });

  it("should find a customer by id", async () => {
    (prismaMock.customer.findFirst as any).mockResolvedValue({ id: "c1", name: "John" });
    const result = await repository.findById("c1");
    expect(result?.name).toBe("John");
  });

  it("should return null if customer not found by id", async () => {
    (prismaMock.customer.findFirst as any).mockResolvedValue(null);
    const result = await repository.findById("non_existent");
    expect(result).toBeNull();
  });

  it("should find a customer by phone number within the tenant context", async () => {
    const mockCustomer = {
      id: "cust_1",
      name: "John Doe",
      email: "john@example.com",
      phoneNumber: "11999999999",
      creditBalance: 0,
      tenantId: "tenant_123",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    (prismaMock.customer.findFirst as any).mockResolvedValue(mockCustomer);

    const result = await repository.findByPhoneNumber("11999999999");

    expect(prismaMock.customer.findFirst).toHaveBeenCalledWith({
      where: { phoneNumber: "11999999999" },
    });
    expect(result?.name).toBe("John Doe");
  });

  it("should save a new customer", async () => {
    const customerData = { name: "New", phoneNumber: "123", tenantId };
    (prismaMock.customer.create as any).mockResolvedValue({ ...customerData, id: "c1" });

    const result = await repository.save(customerData as any);
    expect(result.id).toBe("c1");
    expect(prismaMock.customer.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: "New" })
    });
  });

  it("should update a customer", async () => {
    (prismaMock.customer.update as any).mockResolvedValue({ id: "c1", name: "Updated" });
    const result = await repository.update("c1", { name: "Updated" });
    expect(result.name).toBe("Updated");
  });

  it("should throw error if session tenant context is missing when currentTenantId is accessed", async () => {
    vi.spyOn(tenantContext, "getStore").mockReturnValue(undefined);

    await expect(repository.upsert("123", { name: "Test" }))
      .rejects.toThrow("Tenant context is missing");
  });

  it("should upsert a customer", async () => {
    vi.spyOn(tenantContext, "getStore").mockReturnValue(tenantId);
    const mockCustomer = { id: "c1", name: "New", phoneNumber: "123", tenantId, creditBalance: 0 };
    (prismaMock.customer.upsert as any).mockResolvedValue(mockCustomer);

    const result = await repository.upsert("123", { name: "New" });

    expect(prismaMock.customer.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { phoneNumber_tenantId: { phoneNumber: "123", tenantId } }
    }));
    expect(result.name).toBe("New");
  });

  it("should find paginated customers with search and includeDeleted", async () => {
    (prismaMock.customer.findMany as any).mockResolvedValue([]);
    (prismaMock.customer.count as any).mockResolvedValue(0);

    await repository.findPaginated(1, 10, { search: "John", includeDeleted: true });

    expect(prismaMock.customer.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: expect.anything()
      })
    }));
    // includeDeleted: true means where should NOT have deletedAt: null
    const callArgs = (prismaMock.customer.findMany as any).mock.calls[0][0];
    expect(callArgs.where.deletedAt).toBeUndefined();
  });

  it("should get customer stats", async () => {
    (prismaMock.order.aggregate as any).mockResolvedValue({
      _sum: { totalAmount: new Prisma.Decimal(100) },
      _count: { id: 2 }
    });

    const stats = await repository.getStats("c1");

    expect(stats.totalSpent).toBe(100);
    expect(stats.totalOrders).toBe(2);
  });

  it("should get stats with zero values", async () => {
    (prismaMock.order.aggregate as any).mockResolvedValue({
      _sum: { totalAmount: null },
      _count: { id: 0 }
    });
    const stats = await repository.getStats("c1");
    expect(stats.totalSpent).toBe(0);
    expect(stats.totalOrders).toBe(0);
  });

  it("should update credit balance", async () => {
    await repository.updateCreditBalance("c1", 50);
    expect(prismaMock.customer.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { creditBalance: { increment: expect.any(Prisma.Decimal) } }
    });
  });

  it("should use transaction for updateCreditBalance", async () => {
    const txMock = mockDeep<Prisma.TransactionClient>();
    await repository.updateCreditBalance("c1", 50, txMock);
    expect(txMock.customer.update).toHaveBeenCalled();
    expect(prismaMock.customer.update).not.toHaveBeenCalled();
  });

  it("should soft delete a customer", async () => {
    await repository.delete("c1");
    expect(prismaMock.customer.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { deletedAt: expect.any(Date) }
    });
  });
});
