import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaReportsRepository } from "@/lib/infrastructure/repositories/prisma-reports.repository";

// Mock the prisma dependency
vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma as prismaMock } from "@/lib/prisma";

describe("PrismaReportsRepository", () => {
  let repository: PrismaReportsRepository;
  const tenantId = "tenant-uuid-123";

  beforeEach(() => {
    mockReset(prismaMock);
    repository = new PrismaReportsRepository();
  });

  it("should cache reports and return cached data on subsequent calls", async () => {
    const mockValuation = [{ set: "ONE", value: 100, count: 10 }];
    
    // Setup mock for first call
    (prismaMock.$queryRaw as any).mockResolvedValue(mockValuation);

    // First call (hits DB)
    const result1 = await repository.getInventoryValuationBySet(tenantId);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result1).toEqual(mockValuation);

    // Second call (should hit cache)
    const result2 = await repository.getInventoryValuationBySet(tenantId);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1); // Still 1
    expect(result2).toEqual(mockValuation);
  });

  it("should correctly map complex raw SQL results for weekly revenue", async () => {
    const rawSqlResults = [
      { day_of_week: "1", amount: 500 },
      { day_of_week: "2", amount: 300 }
    ];

    (prismaMock.$queryRaw as any).mockResolvedValue(rawSqlResults);

    const results = await repository.getWeeklyRevenue(tenantId);

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ day: "Dom", amount: 500 });
    expect(results[1]).toEqual({ day: "Seg", amount: 300 });
  });

  it("should calculate customer LTV using Prisma aggregates", async () => {
    (prismaMock.order.aggregate as any).mockResolvedValue({
      _sum: { totalAmount: new Prisma.Decimal(1500.50) }
    });

    const ltv = await repository.getCustomerLTV(tenantId, "cust_1");

    expect(prismaMock.order.aggregate).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ customerId: "cust_1" }),
      _sum: { totalAmount: true }
    }));
    expect(ltv).toBe(1500.50);
  });

  it("should groupConditionDistribution correctly", async () => {
    const mockGroups = [
      { condition: "NM", _count: { id: 5 } },
      { condition: "SP", _count: { id: 3 } }
    ];

    (prismaMock.inventoryItem.groupBy as any).mockResolvedValue(mockGroups);

    const results = await repository.getInventoryConditionDistribution(tenantId);

    expect(results).toHaveLength(2);
    expect(results[0].condition).toBe("NM");
    expect(results[0].count).toBe(5);
  });

  it("should get revenue by category using raw SQL", async () => {
    const mockRows = [{ category: "Singles", count: 10, revenue: 100.5 }];
    (prismaMock.$queryRaw as any).mockResolvedValue(mockRows);

    const results = await repository.getRevenueByCategory(tenantId);

    expect(prismaMock.$queryRaw).toHaveBeenCalled();
    expect(results[0].category).toBe("Singles");
    expect(results[0].revenue).toBe(100.5);
  });

  it("should get top selling products using raw SQL", async () => {
    const mockRows = [{ id: "p1", name: "Product 1", image_url: null, count: 5, revenue: 50 }];
    (prismaMock.$queryRaw as any).mockResolvedValue(mockRows);

    const results = await repository.getTopSellingProducts(tenantId, 5);

    expect(prismaMock.$queryRaw).toHaveBeenCalled();
    expect(results[0].name).toBe("Product 1");
  });

  it("should get sales by source using groupBy", async () => {
    const mockGroups = [
      { source: "POS", _count: { id: 10 }, _sum: { totalAmount: new Prisma.Decimal(1000) } }
    ];
    (prismaMock.order.groupBy as any).mockResolvedValue(mockGroups);

    const results = await repository.getSalesBySource(tenantId);

    expect(prismaMock.order.groupBy).toHaveBeenCalled();
    expect(results[0].source).toBe("POS");
    expect(results[0].revenue).toBe(1000);
  });

  it("should get monthly revenue trend using raw SQL", async () => {
    const mockRows = [{ month_label: "Jan", revenue: 1000, month_date: new Date() }];
    (prismaMock.$queryRaw as any).mockResolvedValue(mockRows);

    const results = await repository.getMonthlyRevenueTrend(tenantId);

    expect(prismaMock.$queryRaw).toHaveBeenCalled();
    expect(results[0].month).toBe("Jan");
  });

  it("should handle expired cache entries", async () => {
    const valuation = [{ set: "ONE", value: 100, count: 10 }];
    (prismaMock.$queryRaw as any).mockResolvedValue(valuation);

    // Mock Date.now to control expiry
    const now = 1000000;
    vi.spyOn(Date, "now").mockReturnValue(now);

    await repository.getInventoryValuationBySet(tenantId);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);

    // Advance time past TTL
    vi.spyOn(Date, "now").mockReturnValue(now + 600000); // +10 min

    await repository.getInventoryValuationBySet(tenantId);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it("should get revenue by set using raw SQL", async () => {
    const mockRows = [{ set: "ONE", count: 10, revenue: 500 }];
    (prismaMock.$queryRaw as any).mockResolvedValue(mockRows);

    const results = await repository.getRevenueBySet(tenantId, new Date(), new Date());

    expect(prismaMock.$queryRaw).toHaveBeenCalled();
    expect(results[0].set).toBe("ONE");
    expect(results[0].revenue).toBe(500);
  });

  it("should get top customers by LTV including mapping missing customers", async () => {
    const mockGroups = [
      { customerId: "c1", _sum: { totalAmount: new Prisma.Decimal(100) }, _count: { id: 2 } },
      { customerId: "c2", _sum: { totalAmount: new Prisma.Decimal(50) }, _count: { id: 1 } }
    ];
    (prismaMock.order.groupBy as any).mockResolvedValue(mockGroups);
    (prismaMock.customer.findMany as any).mockResolvedValue([
      { id: "c1", name: "John", phoneNumber: "123" }
    ]);

    const results = await repository.getTopCustomersByLTV(tenantId, 5);

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("John");
    expect(results[1].name).toBe("Desconhecido"); // c2 not found
    expect(results[1].phoneNumber).toBe("");
  });

  it("should translate monthly revenue labels correctly", async () => {
    const mockRows = [
      { month_label: "Jan", revenue: 100, month_date: new Date() },
      { month_label: "May", revenue: 200, month_date: new Date() },
      { month_label: "Unknown", revenue: 300, month_date: new Date() }
    ];
    (prismaMock.$queryRaw as any).mockResolvedValue(mockRows);

    const results = await repository.getMonthlyRevenueTrend(tenantId);

    expect(results[0].month).toBe("Jan");
    expect(results[1].month).toBe("Mai"); // May -> Mai
    expect(results[2].month).toBe("Unknown");
  });

  it("should handle default day names in weekly revenue", async () => {
    (prismaMock.$queryRaw as any).mockResolvedValue([{ day_of_week: "9", amount: 100 }]);
    const results = await repository.getWeeklyRevenue(tenantId);
    expect(results[0].day).toBe("9");
  });

  it("should use date filters in getRevenueByCategory", async () => {
    (prismaMock.$queryRaw as any).mockResolvedValue([]);
    await repository.getRevenueByCategory(tenantId, new Date(), new Date());
    expect(prismaMock.$queryRaw).toHaveBeenCalled();
  });
});
