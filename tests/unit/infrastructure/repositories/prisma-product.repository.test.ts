import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, Prisma } from "@prisma/client";

// Mock the prisma dependency
vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma as prismaMock } from "@/lib/prisma";
import { PrismaProductRepository } from "@/lib/infrastructure/repositories/prisma-product.repository";
import { tenantContext } from "@/lib/tenant-context";

describe("PrismaProductRepository", () => {
  let repository: PrismaProductRepository;
  const tenantId = "tenant_123";

  beforeEach(() => {
    mockReset(prismaMock);
    repository = new PrismaProductRepository();
    vi.spyOn(tenantContext, "getStore").mockReturnValue(tenantId);
  });

  it("should find a product by id with category", async () => {
    const mockProduct = {
      id: "prod_1",
      name: "Deck Box",
      price: new Prisma.Decimal(15),
      stock: 10,
      active: true,
      tenantId,
      categoryId: "cat_1",
      category: { id: "cat_1", name: "Accessories" }
    } as any;

    (prismaMock.product.findFirst as any).mockResolvedValue(mockProduct);

    const result = await repository.findById("prod_1");

    expect(prismaMock.product.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "prod_1", deletedAt: null }
    }));
    expect(result?.id).toBe("prod_1");
    expect(result?.price).toBe(15);
  });

  it("should return null if product not found", async () => {
    (prismaMock.product.findFirst as any).mockResolvedValue(null);
    const result = await repository.findById("non_existent");
    expect(result).toBeNull();
  });

  it("should save a new product", async () => {
    const productData = { name: "New Prod", price: 50, stock: 10, tenantId: "tenant_123" };
    (prismaMock.product.create as any).mockResolvedValue({
      ...productData,
      id: "prod_new",
      price: new Prisma.Decimal(50)
    });

    const result = await repository.save(productData as any);

    expect(prismaMock.product.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ name: "New Prod" })
    }));
    expect(result.id).toBe("prod_new");
  });

  it("should update an existing product", async () => {
    const updatedData = { name: "Updated Name", price: 60 };
    (prismaMock.product.update as any).mockResolvedValue({
      id: "prod_1",
      ...updatedData,
      price: new Prisma.Decimal(60),
      tenantId
    });

    const result = await repository.update("prod_1", updatedData as any);

    expect(prismaMock.product.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "prod_1" },
      data: expect.objectContaining({ name: "Updated Name" })
    }));
    expect(result.name).toBe("Updated Name");
  });

  it("should find paginated products with category filter", async () => {
    (prismaMock.product.findMany as any).mockResolvedValue([]);
    (prismaMock.product.count as any).mockResolvedValue(0);

    await repository.findPaginated(1, 10, { categoryId: "cat_1", search: "Box" });

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        categoryId: "cat_1",
        name: { contains: "Box", mode: "insensitive" }
      })
    }));
  });

  it("should decrement stock correctly if conditions are met", async () => {
    (prismaMock.product.updateMany as any).mockResolvedValue({ count: 1 });

    await repository.decrementStock("prod_1", 2);

    expect(prismaMock.product.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "prod_1", active: true }),
      data: { stock: { decrement: 2 } }
    }));
  });

  it("should throw error if decrementStock fails", async () => {
    (prismaMock.product.updateMany as any).mockResolvedValue({ count: 0 });

    await expect(repository.decrementStock("prod_1", 2))
      .rejects.toThrow(/Estoque insuficiente/);
  });

  it("should use transaction client if provided", async () => {
    const txMock = mockDeep<Prisma.TransactionClient>();
    (txMock.product.findFirst as any).mockResolvedValue(null);

    await repository.findById("prod_1", txMock);

    expect(txMock.product.findFirst).toHaveBeenCalled();
    expect(prismaMock.product.findFirst).not.toHaveBeenCalled();
  });

  describe("Categories", () => {
    it("should find all categories", async () => {
      (prismaMock.productCategory.findMany as any).mockResolvedValue([]);
      const results = await repository.findCategories();
      expect(results).toEqual([]);
    });

    it("should find category by id", async () => {
      (prismaMock.productCategory.findFirst as any).mockResolvedValue({ id: "cat_1", name: "Cat 1" } as any);
      const result = await repository.findCategoryById("cat_1");
      expect(result?.id).toBe("cat_1");
    });

    it("should return null if category not found", async () => {
      (prismaMock.productCategory.findFirst as any).mockResolvedValue(null);
      const result = await repository.findCategoryById("non_existent");
      expect(result).toBeNull();
    });

    it("should save a new category", async () => {
      const categoryData = { name: "New Category", tenantId };
      (prismaMock.productCategory.create as any).mockResolvedValue({ id: "cat_new", ...categoryData } as any);
      
      const result = await repository.saveCategory(categoryData as any);
      expect(result.id).toBe("cat_new");
    });

    it("should update a category", async () => {
      (prismaMock.productCategory.update as any).mockResolvedValue({ id: "cat_1", name: "Updated" } as any);
      const result = await repository.updateCategory("cat_1", { name: "Updated" });
      expect(result.name).toBe("Updated");
    });
  });

  it("should soft delete a product", async () => {
    await repository.delete("prod_1");

    expect(prismaMock.product.update).toHaveBeenCalledWith({
      where: { id: "prod_1" },
      data: expect.objectContaining({
        active: false,
        deletedAt: expect.any(Date)
      })
    });
  });
});
