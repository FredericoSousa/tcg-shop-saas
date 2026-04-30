import { describe, it, expect, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaClient } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { Factory } from "@/lib/infrastructure/factory";
import { PrismaInventoryRepository } from "@/lib/infrastructure/repositories/prisma-inventory.repository";
import { PrismaCardTemplateRepository } from "@/lib/infrastructure/repositories/prisma-card-template.repository";
import { PrismaCustomerRepository } from "@/lib/infrastructure/repositories/prisma-customer.repository";
import { PrismaOrderRepository } from "@/lib/infrastructure/repositories/prisma-order.repository";
import { PrismaProductRepository } from "@/lib/infrastructure/repositories/prisma-product.repository";
import { PrismaTenantRepository } from "@/lib/infrastructure/repositories/prisma-tenant.repository";
import { PrismaReportsRepository } from "@/lib/infrastructure/repositories/prisma-reports.repository";
import { PrismaCustomerCreditLedgerRepository } from "@/lib/infrastructure/repositories/prisma-customer-credit-ledger.repository";
import { POSCheckoutUseCase } from "@/lib/application/use-cases/orders/pos-checkout.use-case";

describe("Factory (manual DI for serverless cold-start paths)", () => {
  it("returns Prisma-backed implementations for every repository getter", () => {
    expect(Factory.getInventoryRepository()).toBeInstanceOf(PrismaInventoryRepository);
    expect(Factory.getCardTemplateRepository()).toBeInstanceOf(PrismaCardTemplateRepository);
    expect(Factory.getCustomerRepository()).toBeInstanceOf(PrismaCustomerRepository);
    expect(Factory.getOrderRepository()).toBeInstanceOf(PrismaOrderRepository);
    expect(Factory.getProductRepository()).toBeInstanceOf(PrismaProductRepository);
    expect(Factory.getTenantRepository()).toBeInstanceOf(PrismaTenantRepository);
    expect(Factory.getReportsRepository()).toBeInstanceOf(PrismaReportsRepository);
    expect(Factory.getCustomerCreditLedgerRepository()).toBeInstanceOf(
      PrismaCustomerCreditLedgerRepository,
    );
  });

  it("composes the POS checkout use-case with its required dependencies", () => {
    const useCase = Factory.getPOSCheckoutUseCase();
    expect(useCase).toBeInstanceOf(POSCheckoutUseCase);
  });
});
