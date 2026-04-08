import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { getTenantId } from './tenant-context'

const connectionString = `${process.env.DATABASE_URL}`

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const basePrisma = new PrismaClient({ adapter })

// Models that have a tenant_id field and should be automatically filtered
const tenantAwareModels = [
  'user',
  'inventoryItem',
  'productCategory',
  'product',
  'order',
  'customer'
];

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const tenantId = getTenantId();

        // If we don't have a tenant context, proceed normally
        // This allows internal/initial tasks to skip filtering
        if (!tenantId || !tenantAwareModels.includes(model[0].toLowerCase() + model.slice(1))) {
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
            anyArgs.data = { ...anyArgs.data, tenantId };
          } else if (operation === 'createMany') {
            if (Array.isArray(anyArgs.data)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              anyArgs.data = anyArgs.data.map((item: any) => ({ ...item, tenantId }));
            }
          }
        }

        // Automatic filtering for UPDATE/DELETE operations
        if (['update', 'updateMany', 'upsert', 'delete', 'deleteMany'].includes(operation)) {
          anyArgs.where = { ...anyArgs.where, tenantId };
          
          if (operation === 'upsert') {
            anyArgs.create = { ...anyArgs.create, tenantId };
          }
        }

        return query(anyArgs);
      },
    },
  },
});

const globalForPrisma = globalThis as unknown as { prisma: typeof prisma }

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
