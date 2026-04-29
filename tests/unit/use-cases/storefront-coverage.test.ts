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

  it("filters out items with quantity 0", async () => {
    inventoryRepo.findAllActive.mockResolvedValue([
      item({ id: "a", quantity: 0 }),
      item({ id: "b", quantity: 3 }),
    ]);
    const useCase = new GetStorefrontInventoryUseCase(inventoryRepo);
    const result = await useCase.execute({ tenantId: "t1", page: 1 });
    expect(result.items.map((i) => i.id)).toEqual(["b"]);
  });

  it("filters by color when provided", async () => {
    inventoryRepo.findAllActive.mockResolvedValue([
      item({ id: "red", cardTemplate: { id: "1", name: "R", set: "lea", metadata: { color_identity: ["R"] } } as unknown as InventoryItem["cardTemplate"] }),
      item({ id: "blue", cardTemplate: { id: "2", name: "B", set: "lea", metadata: { color_identity: ["U"] } } as unknown as InventoryItem["cardTemplate"] }),
    ]);
    const useCase = new GetStorefrontInventoryUseCase(inventoryRepo);
    const result = await useCase.execute({ tenantId: "t1", page: 1, filters: { color: ["U"] } });
    expect(result.items.map((i) => i.id)).toEqual(["blue"]);
  });

  it("treats colorless cards via the 'C' tag", async () => {
    inventoryRepo.findAllActive.mockResolvedValue([
      item({ id: "colorless", cardTemplate: { id: "1", name: "X", set: "lea", metadata: { color_identity: [] } } as unknown as InventoryItem["cardTemplate"] }),
      item({ id: "red", cardTemplate: { id: "2", name: "Y", set: "lea", metadata: { color_identity: ["R"] } } as unknown as InventoryItem["cardTemplate"] }),
    ]);
    const useCase = new GetStorefrontInventoryUseCase(inventoryRepo);
    const result = await useCase.execute({ tenantId: "t1", page: 1, filters: { color: ["C"] } });
    expect(result.items.map((i) => i.id)).toEqual(["colorless"]);
  });

  it("paginates with size 20 and exposes pageCount", async () => {
    inventoryRepo.findAllActive.mockResolvedValue(
      Array.from({ length: 45 }, (_, i) => item({ id: `i${i}` })),
    );
    const useCase = new GetStorefrontInventoryUseCase(inventoryRepo);
    const result = await useCase.execute({ tenantId: "t1", page: 2 });
    expect(result.total).toBe(45);
    expect(result.pageCount).toBe(3); // ceil(45/20)
    expect(result.items.length).toBe(20);
  });

  it("sorts by price ascending when sort=price_asc", async () => {
    inventoryRepo.findAllActive.mockResolvedValue([
      item({ id: "a", price: 30 }),
      item({ id: "b", price: 10 }),
      item({ id: "c", price: 20 }),
    ]);
    const useCase = new GetStorefrontInventoryUseCase(inventoryRepo);
    const result = await useCase.execute({ tenantId: "t1", page: 1, filters: { sort: "price_asc" } });
    expect(result.items.map((i) => i.id)).toEqual(["b", "c", "a"]);
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
