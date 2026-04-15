import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, Prisma } from "@prisma/client";

// Mock the prisma dependency
vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma as prismaMock } from "@/lib/prisma";
import { PrismaBuylistRepository } from "@/lib/infrastructure/repositories/prisma-buylist.repository";
import { tenantContext } from "@/lib/tenant-context";

describe("PrismaBuylistRepository", () => {
  let repository: PrismaBuylistRepository;
  const tenantId = "tenant_123";

  beforeEach(() => {
    mockReset(prismaMock);
    repository = new PrismaBuylistRepository();
    vi.spyOn(tenantContext, "getStore").mockReturnValue(tenantId);
    (prismaMock.$transaction as any).mockImplementation((callback: any) => callback(prismaMock));
  });

  it("should find buylist items for a tenant and include card template", async () => {
    const mockItem = {
      id: "bli_1",
      tenantId,
      cardTemplateId: "tmpl_1",
      priceCash: new Prisma.Decimal(5),
      priceCredit: new Prisma.Decimal(7),
      active: true,
      cardTemplate: {
        id: "tmpl_1",
        name: "Island",
        set: "BRO",
        game: "MAGIC",
      },
    };

    (prismaMock.buylistItem.findMany as any).mockResolvedValue([mockItem]);

    const results = await repository.findItemsByTenant(tenantId);

    expect(prismaMock.buylistItem.findMany).toHaveBeenCalledWith({
      where: { tenantId, active: true },
      include: { cardTemplate: true },
    });
    expect(results[0].priceCash).toBe(5);
    expect(results[0].cardTemplate?.name).toBe("Island");
  });

  it("should create a new buylist proposal with items", async () => {
    const proposal = {
      id: "",
      tenantId,
      customerId: "cust_1",
      status: "PENDING",
      totalCash: 10,
      totalCredit: 15,
      items: [
        { cardTemplateId: "tmpl_1", quantity: 1, condition: "NM", language: "EN", priceCash: 10, priceCredit: 15 }
      ]
    };

    (prismaMock.buylistProposal.create as any).mockResolvedValue({
      ...proposal,
      id: "proposal_1",
      totalCash: new Prisma.Decimal(10),
      totalCredit: new Prisma.Decimal(15),
      items: []
    });

    const result = await repository.saveProposal(proposal as any);

    expect(prismaMock.buylistProposal.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        customerId: "cust_1",
        items: {
          create: [expect.objectContaining({ cardTemplateId: "tmpl_1" })]
        }
      })
    }));
    expect(result.id).toBe("proposal_1");
  });

  it("should find storefont items with color and set filters", async () => {
    (prismaMock.buylistItem.findMany as any).mockResolvedValue([]);

    await repository.findStorefrontItems(tenantId, 1, 10, { color: "W,U", set: "BRO" });

    expect(prismaMock.buylistItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        cardTemplate: expect.objectContaining({
          set: "BRO",
          metadata: expect.objectContaining({
            path: ["colors"],
            array_contains: ["W", "U"]
          })
        })
      })
    }));
  });

  it("should find storefont items with search and type filters", async () => {
    (prismaMock.buylistItem.findMany as any).mockResolvedValue([]);

    await repository.findStorefrontItems(tenantId, 1, 10, { search: "Black Lotus", type: "Artifact" });

    expect(prismaMock.buylistItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        cardTemplate: expect.objectContaining({
          name: { contains: "Black Lotus", mode: 'insensitive' },
          metadata: expect.objectContaining({
            path: ['type_line'],
            string_contains: "Artifact"
          })
        })
      })
    }));
  });

  it("should count items with filters", async () => {
    (prismaMock.buylistItem.count as any).mockResolvedValue(10);

    const count = await repository.countItems(tenantId, { search: "Island", color: "U", set: "BRO" });

    expect(count).toBe(10);
    expect(prismaMock.buylistItem.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        cardTemplate: {
          name: { contains: "Island", mode: 'insensitive' },
          metadata: {
            path: ['colors'],
            array_contains: ["U"]
          },
          set: "BRO"
        }
      })
    }));
  });

  it("should find item by template", async () => {
    (prismaMock.buylistItem.findFirst as any).mockResolvedValue(null);
    const result = await repository.findItemByTemplate(tenantId, "t1");
    expect(result).toBeNull();
  });

  it("should delete item", async () => {
    await repository.deleteItem("bli_1");
    expect(prismaMock.buylistItem.delete).toHaveBeenCalledWith({ where: { id: "bli_1" } });
  });

  it("should find proposals by tenant", async () => {
    (prismaMock.buylistProposal.findMany as any).mockResolvedValue([
      { id: "p1", tenantId, totalCash: new Prisma.Decimal(10), totalCredit: new Prisma.Decimal(20), status: "PENDING" }
    ]);
    const results = await repository.findProposalsByTenant(tenantId);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("p1");
  });

  it("should update proposal status", async () => {
    await repository.updateProposalStatus("p1", "APPROVED", "Checked everything");
    expect(prismaMock.buylistProposal.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { status: "APPROVED", staffNotes: "Checked everything" }
    });
  });

  it("should update proposal status without notes", async () => {
    await repository.updateProposalStatus("p1", "CANCELLED");
    expect(prismaMock.buylistProposal.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { status: "CANCELLED" }
    });
  });

  it("should find proposal by id and map complex nested items", async () => {
    const mockProposal = {
      id: "p1",
      tenantId,
      customerId: "c1",
      status: "PENDING",
      totalCash: new Prisma.Decimal(10),
      totalCredit: new Prisma.Decimal(15),
      customer: { name: "John", phoneNumber: "123" },
      items: [
        { 
          id: "pi1", 
          buylistProposalId: "p1", 
          cardTemplateId: "t1",
          quantity: 1, 
          condition: "NM", 
          language: "EN",
          priceCash: new Prisma.Decimal(10),
          priceCredit: new Prisma.Decimal(15),
          cardTemplate: { id: "t1", name: "Card" }
        }
      ]
    };

    (prismaMock.buylistProposal.findUnique as any).mockResolvedValue(mockProposal);

    const result = await repository.findProposalById("p1");

    expect(result?.id).toBe("p1");
    expect(result?.customer?.name).toBe("John");
    expect(result?.items?.[0].cardTemplate?.name).toBe("Card");
  });

  it("should saveItem using create if id is missing", async () => {
    (prismaMock.buylistItem.create as any).mockResolvedValue({ id: "new", tenantId, cardTemplateId: "t1", priceCash: new Prisma.Decimal(5), priceCredit: new Prisma.Decimal(1), active: true });

    await repository.saveItem({ tenantId, cardTemplateId: "t1", priceCash: 5, priceCredit: 1, active: true } as any);

    expect(prismaMock.buylistItem.create).toHaveBeenCalled();
  });

  it("should saveItem using create if id is empty string", async () => {
    (prismaMock.buylistItem.create as any).mockResolvedValue({ id: "new", tenantId, cardTemplateId: "t1", priceCash: new Prisma.Decimal(5), priceCredit: new Prisma.Decimal(1), active: true });

    await repository.saveItem({ id: "", tenantId, cardTemplateId: "t1", priceCash: 5, priceCredit: 1, active: true } as any);

    expect(prismaMock.buylistItem.create).toHaveBeenCalled();
  });

  it("should saveItem using upsert if id is provided", async () => {
    (prismaMock.buylistItem.upsert as any).mockResolvedValue({ id: "ext", tenantId, cardTemplateId: "t1", priceCash: new Prisma.Decimal(5), priceCredit: new Prisma.Decimal(1), active: true });

    await repository.saveItem({ id: "ext", tenantId, cardTemplateId: "t1", priceCash: 5, priceCredit: 1, active: true } as any);

    expect(prismaMock.buylistItem.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "ext" }
    }));
  });

  it("should find item by template with result", async () => {
    (prismaMock.buylistItem.findFirst as any).mockResolvedValue({
      id: "bli_1", tenantId, cardTemplateId: "t1", priceCash: new Prisma.Decimal(10), priceCredit: new Prisma.Decimal(20), active: true
    });
    const result = await repository.findItemByTemplate(tenantId, "t1");
    expect(result?.id).toBe("bli_1");
  });

  it("should map to domain without card template", async () => {
    (prismaMock.buylistItem.findMany as any).mockResolvedValue([{
      id: "bli_1", tenantId, cardTemplateId: "t1", priceCash: new Prisma.Decimal(10), priceCredit: new Prisma.Decimal(20), active: true
    }]);

    const results = await repository.findItemsByTenant(tenantId);
    expect(results[0].cardTemplate).toBeUndefined();
  });
});
