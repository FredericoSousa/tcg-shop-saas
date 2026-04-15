import "reflect-metadata";
import { container, Lifecycle } from "tsyringe";
import { PrismaInventoryRepository } from "./repositories/prisma-inventory.repository";
import { PrismaCardTemplateRepository } from "./repositories/prisma-card-template.repository";
import { PrismaCustomerRepository } from "./repositories/prisma-customer.repository";
import { PrismaOrderRepository } from "./repositories/prisma-order.repository";
import { PrismaProductRepository } from "./repositories/prisma-product.repository";
import { PrismaTenantRepository } from "./repositories/prisma-tenant.repository";
import { PrismaUserRepository } from "./repositories/prisma-user.repository";
import { PrismaReportsRepository } from "./repositories/prisma-reports.repository";
import { PrismaCustomerCreditLedgerRepository } from "./repositories/prisma-customer-credit-ledger.repository";
import { PrismaBuylistRepository } from "./repositories/prisma-buylist.repository";

export const TOKENS = {
  InventoryRepository: Symbol("InventoryRepository"),
  CardTemplateRepository: Symbol("CardTemplateRepository"),
  CustomerRepository: Symbol("CustomerRepository"),
  OrderRepository: Symbol("OrderRepository"),
  ProductRepository: Symbol("ProductRepository"),
  TenantRepository: Symbol("TenantRepository"),
  UserRepository: Symbol("UserRepository"),
  ReportsRepository: Symbol("ReportsRepository"),
  CustomerCreditLedgerRepository: Symbol("CustomerCreditLedgerRepository"),
  BuylistRepository: Symbol("BuylistRepository"),
};

// Register Repositories as Singletons
container.register(TOKENS.InventoryRepository, { useClass: PrismaInventoryRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.CardTemplateRepository, { useClass: PrismaCardTemplateRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.CustomerRepository, { useClass: PrismaCustomerRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.OrderRepository, { useClass: PrismaOrderRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.ProductRepository, { useClass: PrismaProductRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.TenantRepository, { useClass: PrismaTenantRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.UserRepository, { useClass: PrismaUserRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.ReportsRepository, { useClass: PrismaReportsRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.CustomerCreditLedgerRepository, { useClass: PrismaCustomerCreditLedgerRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.BuylistRepository, { useClass: PrismaBuylistRepository }, { lifecycle: Lifecycle.Singleton });

export { container };
