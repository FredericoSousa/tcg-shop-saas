import { describe, it, expect, beforeEach } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import "reflect-metadata";
import { ExportCustomerUseCase } from "@/lib/application/use-cases/gdpr/export-customer.use-case";
import { EraseCustomerUseCase } from "@/lib/application/use-cases/gdpr/erase-customer.use-case";
import { EntityNotFoundError } from "@/lib/domain/errors/domain.error";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import type { ICustomerCreditLedgerRepository } from "@/lib/domain/repositories/customer-credit-ledger.repository";
import type { IBuylistRepository } from "@/lib/domain/repositories/buylist.repository";
import type { IAuditLogRepository } from "@/lib/domain/repositories/audit-log.repository";

function customer() {
  return {
    id: "c1",
    name: "Alice",
    email: "alice@example.com",
    phoneNumber: "+5511999999999",
    creditBalance: 12.5,
    tenantId: "t1",
    createdAt: new Date("2026-01-01"),
    updatedAt: null,
    deletedAt: null,
  };
}

describe("ExportCustomerUseCase", () => {
  let customers: MockProxy<ICustomerRepository>;
  let orders: MockProxy<IOrderRepository>;
  let ledger: MockProxy<ICustomerCreditLedgerRepository>;
  let buylists: MockProxy<IBuylistRepository>;
  let useCase: ExportCustomerUseCase;

  beforeEach(() => {
    customers = mock<ICustomerRepository>();
    orders = mock<IOrderRepository>();
    ledger = mock<ICustomerCreditLedgerRepository>();
    buylists = mock<IBuylistRepository>();
    useCase = new ExportCustomerUseCase(customers, orders, ledger, buylists);
  });

  it("throws when the customer is not found", async () => {
    customers.findById.mockResolvedValue(null);
    await expect(useCase.execute("missing")).rejects.toThrow(EntityNotFoundError);
  });

  it("returns aggregated data for the customer", async () => {
    customers.findById.mockResolvedValue(customer());
    orders.findAllByCustomerId.mockResolvedValue([]);
    ledger.findByCustomerId.mockResolvedValue([]);
    buylists.findProposalsByCustomerId.mockResolvedValue([]);

    const out = await useCase.execute("c1");
    expect(out.customer.id).toBe("c1");
    expect(out.customer.email).toBe("alice@example.com");
    expect(out.exportedAt).toBeDefined();
  });
});

describe("EraseCustomerUseCase", () => {
  it("anonymises the customer and writes an audit entry", async () => {
    const customers = mock<ICustomerRepository>();
    const audit = mock<IAuditLogRepository>();
    customers.findById.mockResolvedValue(customer());

    const useCase = new EraseCustomerUseCase(customers, audit);
    await useCase.execute({ customerId: "c1", actorUserId: "u1", tenantId: "t1" });

    expect(customers.anonymise).toHaveBeenCalledWith("c1");
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DELETE",
        entityType: "Customer",
        entityId: "c1",
        actorId: "u1",
        tenantId: "t1",
      }),
    );
  });

  it("throws when the target customer does not exist", async () => {
    const customers = mock<ICustomerRepository>();
    const audit = mock<IAuditLogRepository>();
    customers.findById.mockResolvedValue(null);

    const useCase = new EraseCustomerUseCase(customers, audit);
    await expect(
      useCase.execute({ customerId: "c1", actorUserId: "u1", tenantId: "t1" }),
    ).rejects.toThrow(EntityNotFoundError);
    expect(audit.record).not.toHaveBeenCalled();
  });
});
