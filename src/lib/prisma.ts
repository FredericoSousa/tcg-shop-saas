import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { resolveTenantId } from './tenant-context'

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof buildExtendedClient>
  pgPool?: Pool
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

        if (!isTenantAware) {
          return query(args);
        }

        const tenantId = await resolveTenantId();

        // If we don't have a tenant context, proceed normally
        // This allows internal/initial tasks to skip filtering
        if (!tenantId) {
          return query(args);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyArgs = args as any;

        // Automatic filtering for READ operations
        if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
          anyArgs.where = { ...anyArgs.where, tenantId };
        }

        // Automatic tenantId injection for CREATE operations
        if (['create', 'createMany'].includes(operation)) {
          if (operation === 'create') {
            // Only inject if tenantId or tenant relation is not already provided
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

        // Automatic filtering for UPDATE/DELETE operations
        if (['update', 'updateMany', 'upsert', 'delete', 'deleteMany'].includes(operation)) {
          anyArgs.where = { ...anyArgs.where, tenantId };
          
          if (operation === 'upsert') {
            if (!anyArgs.create.tenantId && !anyArgs.create.tenant) {
              anyArgs.create = { ...anyArgs.create, tenantId };
            }
          }
        }

        return query(anyArgs);
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
