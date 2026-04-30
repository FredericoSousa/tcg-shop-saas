import { describe, it, expect, beforeEach } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import { GetStorefrontInventoryUseCase } from "@/lib/application/use-cases/storefront/get-storefront-inventory.use-case";
import { GetStorefrontFiltersUseCase } from "@/lib/application/use-cases/storefront/get-storefront-filters.use-case";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import type { InventoryItem } from "@/lib/domain/entities/inventory";

function item(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: overrides.id ?? "i1",
    tenantId: "t1",
    cardTemplateId: "ct1",
    price: 10,
    quantity: 1,
    condition: "NM",
    language: "EN",
    active: true,
    extras: [],
    cardTemplate: {
      id: "ct1",
      name: "Lightning Bolt",
      set: "lea",
      metadata: { color_identity: ["R"], type_line: "Instant" },
    },
    ...overrides,
  } as InventoryItem;
}

describe("GetStorefrontInventoryUseCase", () => {
  let inventoryRepo: MockProxy<IInventoryRepository>;

  beforeEach(() => {
    inventoryRepo = mock<IInventoryRepository>();
  });

  it("forwards filters to findStorefrontItems with the right page and size", async () => {
    inventoryRepo.findStorefrontItems.mockResolvedValue({ items: [], total: 0 });
    const useCase = new GetStorefrontInventoryUseCase(inventoryRepo);

    await useCase.execute({
      tenantId: "t1",
      page: 3,
      filters: { color: "U", language: "EN", sort: "price_asc", set: "NEO" },
    });

    expect(inventoryRepo.findStorefrontItems).toHaveBeenCalledWith(
      "t1",
      3,
      20,
      expect.objectContaining({ color: "U", language: "EN", sort: "price_asc", set: "NEO" }),
    );
  });

  it("ignores invalid sort values", async () => {
    inventoryRepo.findStorefrontItems.mockResolvedValue({ items: [], total: 0 });
    const useCase = new GetStorefrontInventoryUseCase(inventoryRepo);

    await useCase.execute({ tenantId: "t1", page: 1, filters: { sort: "bogus" } });

    expect(inventoryRepo.findStorefrontItems).toHaveBeenCalledWith(
      "t1",
      1,
      20,
      expect.objectContaining({ sort: undefined }),
    );
  });

  it("computes pageCount from the repository total", async () => {
    inventoryRepo.findStorefrontItems.mockResolvedValue({
      items: [item()],
      total: 45,
    });
    const useCase = new GetStorefrontInventoryUseCase(inventoryRepo);

    const result = await useCase.execute({ tenantId: "t1", page: 1 });

    expect(result.total).toBe(45);
    expect(result.pageCount).toBe(3); // ceil(45/20)
  });

  it("clamps page to 1 when given a non-positive value", async () => {
    inventoryRepo.findStorefrontItems.mockResolvedValue({ items: [], total: 0 });
    const useCase = new GetStorefrontInventoryUseCase(inventoryRepo);

    await useCase.execute({ tenantId: "t1", page: 0 });

    expect(inventoryRepo.findStorefrontItems).toHaveBeenCalledWith(
      "t1",
      1,
      20,
      expect.anything(),
    );
  });
});

describe("GetStorefrontFiltersUseCase", () => {
  it("derives all available facets from active inventory", async () => {
    const inventoryRepo = mock<IInventoryRepository>();
    inventoryRepo.findAllActive.mockResolvedValue([
      item({
        id: "1",
        language: "PT",
        extras: ["foil"],
        cardTemplate: {
          id: "1",
          name: "X",
          set: "neo",
          metadata: { color_identity: ["R"], type_line: "Creature — Dragon" },
        } as unknown as InventoryItem["cardTemplate"],
      }),
      item({
        id: "2",
        language: "EN",
        extras: ["signed"],
        cardTemplate: {
          id: "2",
          name: "Y",
          set: "MOM",
          metadata: { color_identity: [], type_line: "Land" },
        } as unknown as InventoryItem["cardTemplate"],
      }),
    ]);
    const useCase = new GetStorefrontFiltersUseCase(inventoryRepo);
    const result = await useCase.execute({ tenantId: "t1" });
    expect(result.colors).toEqual(expect.arrayContaining(["R", "C"]));
    expect(result.types).toEqual(expect.arrayContaining(["Creature", "Land"]));
    expect(result.sets).toEqual(expect.arrayContaining(["NEO", "MOM"]));
    expect(result.languages).toEqual(expect.arrayContaining(["PT", "EN"]));
    expect(result.extras).toEqual(expect.arrayContaining(["foil", "signed"]));
  });
});
