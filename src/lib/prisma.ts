import { PrismaClient, Prisma } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { AsyncLocalStorage } from 'async_hooks'
import { resolveTenantId } from './tenant-context'

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof buildExtendedClient>
  pgPool?: Pool
  rlsBypassStorage?: AsyncLocalStorage<boolean>
}

function buildPool(): Pool {
  // Defaults tuned for Supabase/pgbouncer-style poolers: small per-instance
  // pool, short idle timeout. Override via env when self-hosting Postgres.
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DB_POOL_MAX ?? 5),
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_MS ?? 10_000),
    connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS ?? 5_000),
  })
}

const pool = globalForPrisma.pgPool ?? buildPool()
const adapter = new PrismaPg(pool)
const basePrisma = new PrismaClient({ adapter })

// Cross-tenant operations (outbox worker, tenant lookup before a request
// has resolved its tenant, login flow) opt in by entering this scope.
// We keep the storage on globalThis so HMR doesn't fork it.
const rlsBypassStorage =
  globalForPrisma.rlsBypassStorage ?? new AsyncLocalStorage<boolean>()
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.rlsBypassStorage = rlsBypassStorage
}

export function withRLSBypass<T>(callback: () => T): T {
  return rlsBypassStorage.run(true, callback)
}

function isRLSBypassed(): boolean {
  return rlsBypassStorage.getStore() === true
}

// Models that have a tenant_id field and should be automatically filtered
const tenantAwareModels = [
  'inventoryItem',
  'productCategory',
  'product',
  'order',
  'customer',
  'customerCreditLedger'
];

function buildExtendedClient() {
  return basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const modelKey = model[0].toLowerCase() + model.slice(1);
        const isTenantAware = tenantAwareModels.includes(modelKey);
        const bypass = isRLSBypassed();
        const tenantId = bypass ? undefined : await resolveTenantId();

        // App-level tenant scoping. Only runs for known tenant-aware
        // models AND when we have a tenant context. Skipped under
        // bypass so cross-tenant workers can read everything.
        if (isTenantAware && !bypass && tenantId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const anyArgs = args as any;

          if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
            anyArgs.where = { ...anyArgs.where, tenantId };
          }

          if (['create', 'createMany'].includes(operation)) {
            if (operation === 'create') {
              if (!anyArgs.data.tenantId && !anyArgs.data.tenant) {
                anyArgs.data = { ...anyArgs.data, tenantId };
              }
            } else if (operation === 'createMany') {
              if (Array.isArray(anyArgs.data)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                anyArgs.data = anyArgs.data.map((item: any) => {
                  if (!item.tenantId && !item.tenant) {
                    return { ...item, tenantId };
                  }
                  return item;
                });
              }
            }
          }

          if (['update', 'updateMany', 'upsert', 'delete', 'deleteMany'].includes(operation)) {
            anyArgs.where = { ...anyArgs.where, tenantId };

            if (operation === 'upsert') {
              if (!anyArgs.create.tenantId && !anyArgs.create.tenant) {
                anyArgs.create = { ...anyArgs.create, tenantId };
              }
            }
          }
        }

        // DB-level RLS. Every query is wrapped in a transaction that
        // first sets the GUC `app.tenant_id` (or `app.bypass_rls`) so
        // the policies in 20260430100000_enable_rls match. The
        // `set_config(..., true)` form is transaction-local so it
        // dies with the tx — safe under pgbouncer connection reuse.
        // No GUC is set if the operation has neither tenant nor
        // bypass; the extension already filtered it at app level for
        // tenant-aware models, and non-tenant-aware tables (tenants,
        // card_templates) don't have RLS.
        if (!tenantId && !bypass) {
          return query(args);
        }

        const setting = bypass
          ? Prisma.sql`SELECT set_config('app.bypass_rls', 'on', true)`
          : Prisma.sql`SELECT set_config('app.tenant_id', ${tenantId!}, true)`;

        const [, result] = await basePrisma.$transaction([
          basePrisma.$executeRaw(setting),
          query(args),
        ]);
        return result;
      },
    },
  },
});
}

// Cache the extended client + the pg pool across HMR reloads in dev to
// avoid leaking pool connections every time a file changes.
export const prisma = globalForPrisma.prisma ?? buildExtendedClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.pgPool = pool
}
