import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaCustomerCreditLedgerRepository } from "@/lib/infrastructure/repositories/prisma-customer-credit-ledger.repository";
import { tenantContext } from "@/lib/tenant-context";

// Mock the prisma dependency
vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma as prismaMock } from "@/lib/prisma";

describe("PrismaCustomerCreditLedgerRepository", () => {
  let repository: PrismaCustomerCreditLedgerRepository;
  const tenantId = "tenant_123";

  beforeEach(() => {
    mockReset(prismaMock);
    repository = new PrismaCustomerCreditLedgerRepository();
    vi.spyOn(tenantContext, "getStore").mockReturnValue(tenantId);
  });

  it("should save a new credit ledger entry", async () => {
    const entry = {
      tenantId,
      customerId: "cust_1",
      amount: 100,
      type: "CREDIT" as any,
      source: "BUYLIST" as any,
      description: "Sold cards"
    };

    (prismaMock.customerCreditLedger.create as any).mockResolvedValue({
      ...entry,
      id: "ledger_1",
      amount: new Prisma.Decimal(100),
      createdAt: new Date()
    });

    const result = await repository.save(entry as any);

    expect(prismaMock.customerCreditLedger.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: expect.any(Prisma.Decimal),
        type: "CREDIT"
      })
    });
    expect(result.amount).toBe(100);
  });

  it("should compute balance correctly summed by type", async () => {
    const mockEntries = [
      { amount: new Prisma.Decimal(100), type: "CREDIT" },
      { amount: new Prisma.Decimal(20), type: "DEBIT" },
      { amount: new Prisma.Decimal(30), type: "CREDIT" }
    ];

    (prismaMock.customerCreditLedger.findMany as any).mockResolvedValue(mockEntries);

    const balance = await repository.computeBalance("cust_1");

    expect(balance).toBe(110); // 100 - 20 + 30
    expect(prismaMock.customerCreditLedger.findMany).toHaveBeenCalledWith({
      where: { customerId: "cust_1" },
      select: { amount: true, type: true }
    });
  });

  it("should find entries by customer id and include order details", async () => {
    (prismaMock.customerCreditLedger.findMany as any).mockResolvedValue([]);

    await repository.findByCustomerId("cust_1");

    expect(prismaMock.customerCreditLedger.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { customerId: "cust_1" },
      include: { order: { select: { friendlyId: true } } }
    }));
  });

  it("should find entries by order id", async () => {
    (prismaMock.customerCreditLedger.findMany as any).mockResolvedValue([]);
    await repository.findByOrderId("order_1");
    expect(prismaMock.customerCreditLedger.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { orderId: "order_1" }
    }));
  });

  it("should use transaction client in save if provided", async () => {
    const txMock = mockDeep<Prisma.TransactionClient>();
    const entry = {
      tenantId,
      customerId: "c1",
      amount: 10,
      type: "CREDIT" as any,
      source: "MANUAL" as any,
      description: "desc"
    };

    (txMock.customerCreditLedger.create as any).mockResolvedValue({
      ...entry,
      id: "l1",
      amount: new Prisma.Decimal(10),
      createdAt: new Date()
    });

    await repository.save(entry as any, txMock);

    expect(txMock.customerCreditLedger.create).toHaveBeenCalled();
    expect(prismaMock.customerCreditLedger.create).not.toHaveBeenCalled();
  });
});
