import { describe, it, expect, beforeEach } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import { ListBuylistItemsUseCase } from "@/lib/application/use-cases/buylist/list-buylist-items.use-case";
import { ListBuylistProposalsUseCase } from "@/lib/application/use-cases/buylist/list-buylist-proposals.use-case";
import { GetBuylistProposalUseCase } from "@/lib/application/use-cases/buylist/get-buylist-proposal.use-case";
import { GetStorefrontBuylistUseCase } from "@/lib/application/use-cases/buylist/get-storefront-buylist.use-case";
import { GetBuylistFiltersUseCase } from "@/lib/application/use-cases/buylist/get-buylist-filters.use-case";
import type { IBuylistRepository } from "@/lib/domain/repositories/buylist.repository";
import { EntityNotFoundError } from "@/lib/domain/errors/domain.error";
import type { BuylistItem, BuylistProposal } from "@/lib/domain/entities/buylist";

describe("buylist read-side use-cases", () => {
  let buylistRepo: MockProxy<IBuylistRepository>;

  beforeEach(() => {
    buylistRepo = mock<IBuylistRepository>();
  });

  describe("ListBuylistItemsUseCase", () => {
    it("delegates to findItemsByTenant", async () => {
      const expected = [{ id: "i1", tenantId: "t1" }] as unknown as BuylistItem[];
      buylistRepo.findItemsByTenant.mockResolvedValue(expected);
      const useCase = new ListBuylistItemsUseCase(buylistRepo);
      await expect(useCase.execute("t1")).resolves.toBe(expected);
      expect(buylistRepo.findItemsByTenant).toHaveBeenCalledWith("t1");
    });
  });

  describe("ListBuylistProposalsUseCase", () => {
    it("delegates to findProposalsByTenant", async () => {
      const expected = [{ id: "p1", tenantId: "t1" }] as unknown as BuylistProposal[];
      buylistRepo.findProposalsByTenant.mockResolvedValue(expected);
      const useCase = new ListBuylistProposalsUseCase(buylistRepo);
      await expect(useCase.execute("t1")).resolves.toBe(expected);
      expect(buylistRepo.findProposalsByTenant).toHaveBeenCalledWith("t1");
    });
  });

  describe("GetBuylistProposalUseCase", () => {
    it("returns the proposal when found", async () => {
      const proposal = { id: "p1", tenantId: "t1" } as unknown as BuylistProposal;
      buylistRepo.findProposalById.mockResolvedValue(proposal);
      const useCase = new GetBuylistProposalUseCase(buylistRepo);
      await expect(useCase.execute("p1")).resolves.toBe(proposal);
    });

    it("throws EntityNotFoundError when missing", async () => {
      buylistRepo.findProposalById.mockResolvedValue(null);
      const useCase = new GetBuylistProposalUseCase(buylistRepo);
      await expect(useCase.execute("missing")).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe("GetStorefrontBuylistUseCase", () => {
    it("paginates with the configured page size and exposes pageCount", async () => {
      const items = [{ id: "i1" }] as unknown as BuylistItem[];
      buylistRepo.findStorefrontItems.mockResolvedValue(items);
      buylistRepo.countItems.mockResolvedValue(75);

      const useCase = new GetStorefrontBuylistUseCase(buylistRepo);
      const result = await useCase.execute({ tenantId: "t1", page: 2, filters: { search: "lightning" } });

      expect(result.items).toBe(items);
      expect(result.total).toBe(75);
      // page size 30 → 75/30 → 3 pages
      expect(result.pageCount).toBe(3);
      expect(buylistRepo.findStorefrontItems).toHaveBeenCalledWith("t1", 2, 30, { search: "lightning" });
    });
  });

  describe("GetBuylistFiltersUseCase", () => {
    it("aggregates colors / types / sets from card metadata", async () => {
      const items: BuylistItem[] = [
        {
          id: "i1",
          cardTemplate: {
            id: "ct1",
            name: "X",
            set: "neo",
            metadata: { color_identity: ["R", "U"], type_line: "Creature — Dragon" },
          },
        } as unknown as BuylistItem,
        {
          id: "i2",
          cardTemplate: {
            id: "ct2",
            name: "Y",
            set: "MOM",
            metadata: { color_identity: ["U"], type_line: "Instant" },
          },
        } as unknown as BuylistItem,
      ];
      buylistRepo.findItemsByTenant.mockResolvedValue(items);

      const useCase = new GetBuylistFiltersUseCase(buylistRepo);
      const result = await useCase.execute({ tenantId: "t1" });

      expect(result.colors).toContain("R");
      expect(result.colors).toContain("U");
      expect(result.colors).toContain("C"); // colorless tag is always appended
      expect(result.types).toEqual(expect.arrayContaining(["Creature", "Instant"]));
      expect(result.sets).toEqual(expect.arrayContaining(["NEO", "MOM"]));
      expect(result.subtypes).toContain("Dragon");
    });
  });
});
