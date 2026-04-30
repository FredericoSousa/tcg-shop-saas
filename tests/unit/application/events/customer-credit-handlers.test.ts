import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import { recordLedgerOnCreditAdjustment } from "@/lib/application/events/customer-credit-handlers";
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import type { ICustomerCreditLedgerRepository } from "@/lib/domain/repositories/customer-credit-ledger.repository";

describe("recordLedgerOnCreditAdjustment", () => {
  let ledgerRepo: MockProxy<ICustomerCreditLedgerRepository>;

  beforeEach(() => {
    ledgerRepo = mock<ICustomerCreditLedgerRepository>();
    vi.spyOn(container, "resolve").mockImplementation((token: unknown) => {
      if (token === TOKENS.CustomerCreditLedgerRepository) return ledgerRepo;
      return {} as never;
    });
  });

  it("writes a CREDIT entry for a positive amount", async () => {
    await recordLedgerOnCreditAdjustment({
      tenantId: "t1",
      customerId: "c1",
      amount: 50,
      newBalance: 50,
      description: "manual top-up",
      source: "MANUAL",
    });

    expect(ledgerRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 50, type: "CREDIT", source: "MANUAL" }),
    );
  });

  it("writes a DEBIT entry with the absolute amount when the adjustment is negative", async () => {
    await recordLedgerOnCreditAdjustment({
      tenantId: "t1",
      customerId: "c1",
      amount: -25,
      newBalance: 25,
      description: "correction",
    });

    expect(ledgerRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 25, type: "DEBIT", source: "MANUAL" }),
    );
  });
});
