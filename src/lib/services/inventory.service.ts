import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

export async function getInventoryPaginated(tenantId: string, page: number, limit: number, search?: string) {
  const skip = (page - 1) * limit;

  const where: Prisma.InventoryItemWhereInput = {
    tenantId,
    ...(search ? {
      cardTemplate: {
        name: {
          contains: search,
          mode: "insensitive"
        }
      }
    } : {})
  };

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      include: {
        cardTemplate: true,
      },
      orderBy: {
        cardTemplate: { name: "asc" },
      },
      skip,
      take: limit,
    }),
    prisma.inventoryItem.count({ where })
  ]);

  return {
    items,
    total,
    pageCount: Math.ceil(total / limit)
  };
}

/**
 * Gets storefront inventory with caching.
 * Uses unstable_cache and adds a revalidation tag based on the tenant.
 */
export async function getStorefrontInventory(tenantId: string) {
  return unstable_cache(
    async () => {
      const items = await prisma.inventoryItem.findMany({
        where: { 
          tenantId,
          quantity: { gt: 0 } // Only show in-stock items in the storefront
        },
        include: {
          cardTemplate: true,
        },
        orderBy: {
          cardTemplate: { name: "asc" },
        },
      });

      return items.map(item => ({
        ...item,
        price: Number(item.price),
        cardTemplate: {
          ...item.cardTemplate,
          metadata: item.cardTemplate.metadata as Record<string, unknown> | null,
        }
      }));
    },
    [`storefront-inventory-${tenantId}`],
    {
      tags: [`tenant-${tenantId}-inventory`],
      revalidate: 3600 // Cache for 1 hour by default, or until invalidated via tag
    }
  )();
}
