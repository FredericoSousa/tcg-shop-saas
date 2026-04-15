import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, Prisma } from "@prisma/client";

// Mock the prisma dependency
vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma as prismaMock } from "@/lib/prisma";
import { PrismaInventoryRepository } from "@/lib/infrastructure/repositories/prisma-inventory.repository";
import { tenantContext } from "@/lib/tenant-context";

describe("PrismaInventoryRepository", () => {
  let repository: PrismaInventoryRepository;
  const tenantId = "tenant_123";

  beforeEach(() => {
    mockReset(prismaMock);
    repository = new PrismaInventoryRepository();
    vi.spyOn(tenantContext, "getStore").mockReturnValue(tenantId);
  });

  it("should find an inventory item by id and include card template", async () => {
    const mockItem = {
      id: "inv_1",
      tenantId,
      cardTemplateId: "tmpl_1",
      price: new Prisma.Decimal(10.5),
      quantity: 5,
      language: "EN",
      condition: "NM",
      active: true,
      allowNegativeStock: false,
      extras: ["foil"],
      cardTemplate: {
        id: "tmpl_1",
        name: "Black Lotus",
        set: "LEA",
        game: "MAGIC",
        metadata: { colors: ["W"] }
      },
    } as any;

    (prismaMock.inventoryItem.findFirst as any).mockResolvedValue(mockItem);

    const result = await repository.findById("inv_1");

    expect(prismaMock.inventoryItem.findFirst).toHaveBeenCalledWith({
      where: { id: "inv_1" },
      include: { cardTemplate: true },
    });
    expect(result?.price).toBe(10.5);
    expect(result?.cardTemplate?.name).toBe("Black Lotus");
    expect(result?.extras).toContain("foil");
  });

  it("should find by template with filters", async () => {
    (prismaMock.inventoryItem.findFirst as any).mockResolvedValue(null);
    const result = await repository.findByTemplate("t1", { price: 10, condition: "NM", language: "EN", extras: ["foil"] });
    expect(result).toBeNull();
    expect(prismaMock.inventoryItem.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        cardTemplateId: "t1",
        price: expect.any(Prisma.Decimal),
        condition: "NM",
        language: "EN",
        extras: { equals: ["foil"] }
      })
    }));
  });

  it("should find many by templates", async () => {
    (prismaMock.inventoryItem.findMany as any).mockResolvedValue([]);
    await repository.findManyByTemplates(["t1", "t2"], tenantId);
    expect(prismaMock.inventoryItem.findMany).toHaveBeenCalled();
  });

  it("should save or update an item using upsert", async () => {
    const item = {
      id: "inv_1",
      tenantId,
      cardTemplateId: "tmpl_1",
      price: 15,
      quantity: 10,
      condition: "NM",
      language: "EN",
      active: true,
      allowNegativeStock: false,
      extras: []
    } as any;

    (prismaMock.inventoryItem.upsert as any).mockResolvedValue({ ...item, price: new Prisma.Decimal(15) });

    const result = await repository.save(item);

    expect(result.id).toBe("inv_1");
    expect(prismaMock.inventoryItem.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "inv_1" }
    }));
  });

  it("should create many items in bulk", async () => {
    const items = [
      {
        id: "",
        tenantId,
        cardTemplateId: "tmpl_1",
        price: 10,
        quantity: 1,
        language: "EN",
        condition: "NM",
        active: true,
        allowNegativeStock: false,
        extras: []
      }
    ];

    await repository.createMany(items as any);

    expect(prismaMock.inventoryItem.createMany).toHaveBeenCalled();
  });

  it("should update specific fields of an inventory item", async () => {
    (prismaMock.inventoryItem.update as any).mockResolvedValue({ id: "inv_1", price: new Prisma.Decimal(20), quantity: 2 });
    const result = await repository.update("inv_1", { price: 20, active: false, allowNegativeStock: true });
    expect(result.price).toBe(20);
    expect(prismaMock.inventoryItem.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ active: false, allowNegativeStock: true })
    }));
  });

  it("should update many items at once", async () => {
    await repository.updateMany(["i1", "i2"], { price: 25 });
    expect(prismaMock.inventoryItem.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { in: ["i1", "i2"] } },
      data: expect.objectContaining({ price: expect.any(Prisma.Decimal) })
    }));
  });

  it("should deactivate many items", async () => {
    await repository.deactivateMany(["i1", "i2"]);
    expect(prismaMock.inventoryItem.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { in: ["i1", "i2"] } },
      data: expect.objectContaining({ active: false })
    }));
  });

  it("should find paginated items with search", async () => {
    (prismaMock.inventoryItem.findMany as any).mockResolvedValue([]);
    (prismaMock.inventoryItem.count as any).mockResolvedValue(0);

    await repository.findPaginated(1, 10, "Black");

    expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { active: true, cardTemplate: { name: { contains: "Black", mode: "insensitive" } } }
    }));
  });

  it("should find storefront items with all sort options", async () => {
    (prismaMock.inventoryItem.findMany as any).mockResolvedValue([]);
    (prismaMock.inventoryItem.count as any).mockResolvedValue(0);

    await repository.findStorefrontItems(tenantId, 1, 10, { sort: "price_asc" });
    expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { price: "asc" } }));

    await repository.findStorefrontItems(tenantId, 1, 10, { sort: "name_asc" });
    expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { cardTemplate: { name: "asc" } } }));

    await repository.findStorefrontItems(tenantId, 1, 10, { sort: "name_desc" });
    expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { cardTemplate: { name: "desc" } } }));

    await repository.findStorefrontItems(tenantId, 1, 10, { sort: "invalid" as any });
    expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { cardTemplate: { name: "asc" } } }));
  });

  it("should find all active items", async () => {
    (prismaMock.inventoryItem.findMany as any).mockResolvedValue([]);
    await repository.findAllActive(tenantId);
    expect(prismaMock.inventoryItem.findMany).toHaveBeenCalled();
  });

  it("should decrement stock safely when enough quantity is available", async () => {
    (prismaMock.inventoryItem.updateMany as any).mockResolvedValue({ count: 1 });
    await repository.decrementStock("inv_1", 2);
    expect(prismaMock.inventoryItem.updateMany).toHaveBeenCalled();
  });

  it("should throw error if decrementStock fails", async () => {
    (prismaMock.inventoryItem.updateMany as any).mockResolvedValue({ count: 0 });
    await expect(repository.decrementStock("inv_1", 10)).rejects.toThrow("Item esgotado ou quantidade insuficiente no estoque.");
  });

  it("should count active items", async () => {
    (prismaMock.inventoryItem.count as any).mockResolvedValue(5);
    const count = await repository.countActive(tenantId);
    expect(count).toBe(5);
  });

  it("should map without card template", async () => {
    (prismaMock.inventoryItem.findFirst as any).mockResolvedValue({
      id: "i1", tenantId, cardTemplateId: "t1", price: new Prisma.Decimal(10), quantity: 1, condition: "NM", language: "PT", active: true, allowNegativeStock: false, extras: []
    });
    const result = await repository.findById("i1");
    expect(result?.cardTemplate).toBeUndefined();
  });
});
