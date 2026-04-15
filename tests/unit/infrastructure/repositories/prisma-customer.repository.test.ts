import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient } from "@prisma/client";
import { PrismaCustomerRepository } from "@/lib/infrastructure/repositories/prisma-customer.repository";
import { tenantContext } from "@/lib/tenant-context";

// Mock the prisma dependency
vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma as prismaMock } from "@/lib/prisma";

describe("PrismaCustomerRepository", () => {
  let repository: PrismaCustomerRepository;

  beforeEach(() => {
    mockReset(prismaMock);
    repository = new PrismaCustomerRepository();
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

    // Setup mock
    (prismaMock.customer.findFirst as any).mockResolvedValue(mockCustomer);

    // Call repository
    const result = await repository.findByPhoneNumber("11999999999");

    // Assertions
    expect(prismaMock.customer.findFirst).toHaveBeenCalledWith({
      where: { phoneNumber: "11999999999" },
    });
    expect(result).toEqual(expect.objectContaining({
      id: "cust_1",
      name: "John Doe",
    }));
  });

  it("should throw error if session tenant context is missing when currentTenantId is accessed", async () => {
    // Ensure tenantContext is empty
    vi.spyOn(tenantContext, "getStore").mockReturnValue(undefined);

    await expect(repository.upsert("123", { name: "Test" }))
      .rejects.toThrow("Tenant context is missing");
  });
});
