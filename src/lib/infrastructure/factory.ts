import { PrismaInventoryRepository } from "./repositories/prisma-inventory.repository";
import { PrismaCardTemplateRepository } from "./repositories/prisma-card-template.repository";
import { PrismaCustomerRepository } from "./repositories/prisma-customer.repository";
import { PrismaOrderRepository } from "./repositories/prisma-order.repository";
import { PrismaProductRepository } from "./repositories/prisma-product.repository";
import { PrismaTenantRepository } from "./repositories/prisma-tenant.repository";
import { PrismaUserRepository } from "./repositories/prisma-user.repository";
import { PrismaReportsRepository } from "./repositories/prisma-reports.repository";
import { PrismaCustomerCreditLedgerRepository } from "./repositories/prisma-customer-credit-ledger.repository";
import { POSCheckoutUseCase } from "../application/use-cases/pos-checkout.use-case";

/**
 * Lightweight Factory for Manual Dependency Injection.
 * Optimized for Serverless Cold Starts (avoids reflect-metadata and tsyringe reflection).
 */
export class Factory {
  // Repositories
  static getInventoryRepository() {
    return new PrismaInventoryRepository();
  }

  static getCardTemplateRepository() {
    return new PrismaCardTemplateRepository();
  }

  static getCustomerRepository() {
    return new PrismaCustomerRepository();
  }

  static getOrderRepository() {
    return new PrismaOrderRepository();
  }

  static getProductRepository() {
    return new PrismaProductRepository();
  }

  static getTenantRepository() {
    return new PrismaTenantRepository();
  }

  static getUserRepository() {
    return new PrismaUserRepository();
  }

  static getReportsRepository() {
    return new PrismaReportsRepository();
  }

  static getCustomerCreditLedgerRepository() {
    return new PrismaCustomerCreditLedgerRepository();
  }

  // Use Cases
  static getPOSCheckoutUseCase() {
    return new POSCheckoutUseCase(
      this.getOrderRepository(),
      this.getProductRepository(),
      this.getCustomerRepository()
    );
  }
}
