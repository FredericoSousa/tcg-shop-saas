import "reflect-metadata";
import { container, Lifecycle } from "tsyringe";
import { PrismaInventoryRepository } from "./repositories/prisma-inventory.repository";
import { PrismaCardTemplateRepository } from "./repositories/prisma-card-template.repository";
import { PrismaCustomerRepository } from "./repositories/prisma-customer.repository";
import { PrismaOrderRepository } from "./repositories/prisma-order.repository";
import { PrismaProductRepository } from "./repositories/prisma-product.repository";
import { PrismaTenantRepository } from "./repositories/prisma-tenant.repository";
import { PrismaReportsRepository } from "./repositories/prisma-reports.repository";
import { PrismaCustomerCreditLedgerRepository } from "./repositories/prisma-customer-credit-ledger.repository";
import { PrismaBuylistRepository } from "./repositories/prisma-buylist.repository";
import { PrismaAuditLogRepository } from "./repositories/prisma-audit-log.repository";
import { CardTemplateService } from "../domain/services/card-template.service";
import { registerEventHandlers } from "../application/events/handlers";
import { MemoryCacheService, RedisCacheService } from "./cache/cache-service";
import { config as appConfig } from "../config";

import { TOKENS } from "./tokens";
export { TOKENS };

// Register Cache Service
container.register(TOKENS.CacheService, {
  useFactory: () => {
    if (appConfig.cache.store === "redis" && appConfig.cache.redisUrl) {
      console.log("[Container] Using RedisCacheService");
      return new RedisCacheService(appConfig.cache.redisUrl);
    }
    console.log("[Container] Using MemoryCacheService");
    return new MemoryCacheService();
  },
});

// Register Repositories as Singletons
container.register(TOKENS.InventoryRepository, { useClass: PrismaInventoryRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.CardTemplateRepository, { useClass: PrismaCardTemplateRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.CustomerRepository, { useClass: PrismaCustomerRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.OrderRepository, { useClass: PrismaOrderRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.ProductRepository, { useClass: PrismaProductRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.TenantRepository, { useClass: PrismaTenantRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.ReportsRepository, { useClass: PrismaReportsRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.CustomerCreditLedgerRepository, { useClass: PrismaCustomerCreditLedgerRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.BuylistRepository, { useClass: PrismaBuylistRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.AuditLogRepository, { useClass: PrismaAuditLogRepository }, { lifecycle: Lifecycle.Singleton });
container.register(TOKENS.CardTemplateService, { useClass: CardTemplateService }, { lifecycle: Lifecycle.Singleton });

// Register Domain Event Handlers
registerEventHandlers();

export { container };
