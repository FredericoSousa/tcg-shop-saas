import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient } from "@prisma/client";
import { PrismaTenantRepository } from "@/lib/infrastructure/repositories/prisma-tenant.repository";

// Mock the prisma dependency
vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma as prismaMock } from "@/lib/prisma";

describe("PrismaTenantRepository", () => {
  let repository: PrismaTenantRepository;

  beforeEach(() => {
    mockReset(prismaMock);
    repository = new PrismaTenantRepository();
  });

  it("should find a tenant by id", async () => {
    (prismaMock.tenant.findUnique as any).mockResolvedValue({ id: "t1", name: "Shop" });
    const result = await repository.findById("t1");
    expect(result?.name).toBe("Shop");
  });

  it("should return null if tenant not found by id", async () => {
    (prismaMock.tenant.findUnique as any).mockResolvedValue(null);
    const result = await repository.findById("non_existent");
    expect(result).toBeNull();
  });

  it("should find a tenant by slug", async () => {
    const mockTenant = {
      id: "tenant_1",
      name: "My Shop",
      slug: "my-shop",
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prismaMock.tenant.findUnique as any).mockResolvedValue(mockTenant);

    const result = await repository.findBySlug("my-shop");

    expect(prismaMock.tenant.findUnique).toHaveBeenCalledWith({
      where: { slug: "my-shop" }
    });
    expect(result?.name).toBe("My Shop");
  });

  it("should return null if tenant not found by slug", async () => {
    (prismaMock.tenant.findUnique as any).mockResolvedValue(null);
    const result = await repository.findBySlug("non_existent");
    expect(result).toBeNull();
  });

  it("should update tenant settings", async () => {
    const updateData = { name: "Updated Name" };
    const mockUpdatedTenant = {
      id: "tenant_1",
      name: "Updated Name",
      slug: "my-shop",
    };

    (prismaMock.tenant.update as any).mockResolvedValue(mockUpdatedTenant);

    const result = await repository.update("tenant_1", updateData as any);

    expect(prismaMock.tenant.update).toHaveBeenCalledWith({
      where: { id: "tenant_1" },
      data: updateData
    });
    expect(result.name).toBe("Updated Name");
  });
});
