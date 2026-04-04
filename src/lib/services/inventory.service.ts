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
export async function getStorefrontInventory(
  tenantId: string, 
  page: number = 1, 
  filters?: { color?: string | string[], type?: string | string[], set?: string, search?: string, sort?: string }
) {
  const limit = 20;
  const skip = (page - 1) * limit;
  const cacheKey = `storefront-inventory-${tenantId}-p${page}-${filters?.color?.toString() || 'all'}-${filters?.type || 'all'}-${filters?.set || 'all'}-${filters?.search || 'none'}-${filters?.sort || 'def'}`;

  return unstable_cache(
    async () => {
      // Build metadata filters if possible. Since Prisma Json filtering is limited,
      // it's tricky to filter arrays exactly depending on DB. 
      // For simplicity and safety in PostgreSQL jsonb:
      
      const allItems = await prisma.inventoryItem.findMany({
        where: { 
          tenantId,
          quantity: { gt: 0 }
        },
        include: {
          cardTemplate: true,
        },
        orderBy: {
          cardTemplate: { name: "asc" },
        },
      });

      // Filter in JS since parsing complex JSON arrays reliably in Prisma varies.
      // But because it's in unstable_cache, it only runs once per hour (per filter combination).
      const filtered = allItems.filter(item => {
        const meta = item.cardTemplate.metadata as any;
        if (filters?.color) {
          const expectedColors = Array.isArray(filters.color) ? filters.color : filters.color.split(',');
          const cardColors = meta?.colors || [];
          
          const isColorless = cardColors.length === 0;
          const matchesColorless = isColorless && expectedColors.includes("C");
          const matchesColor = !isColorless && expectedColors.some(c => cardColors.includes(c));
          
          if (!matchesColorless && !matchesColor) return false;
        }
        if (filters?.type) {
          const expectedTypes = Array.isArray(filters.type) ? filters.type : filters.type.split(',');
          if (!meta?.type_line) return false;
          const matchesType = expectedTypes.some(t => meta?.type_line?.includes(t));
          if (!matchesType) return false;
        }
        if (filters?.set && item.cardTemplate.set.toUpperCase() !== filters.set.toUpperCase()) return false;
        return true;
      });

      let finalFiltered = filtered;
      if (filters?.search) {
        const query = filters.search.toLowerCase();
        finalFiltered = finalFiltered.filter(item => 
          item.cardTemplate.name.toLowerCase().includes(query)
        );
      }

      if (filters?.sort) {
        if (filters.sort === 'price_asc') {
          finalFiltered.sort((a, b) => Number(a.price) - Number(b.price));
        } else if (filters.sort === 'price_desc') {
          finalFiltered.sort((a, b) => Number(b.price) - Number(a.price));
        } else if (filters.sort === 'name_asc') {
          finalFiltered.sort((a, b) => a.cardTemplate.name.localeCompare(b.cardTemplate.name));
        } else if (filters.sort === 'name_desc') {
          finalFiltered.sort((a, b) => b.cardTemplate.name.localeCompare(a.cardTemplate.name));
        }
      }

      const paginated = finalFiltered.slice(skip, skip + limit);

      return {
        items: paginated.map(item => ({
          ...item,
          price: Number(item.price),
          cardTemplate: {
            ...item.cardTemplate,
            metadata: item.cardTemplate.metadata as Record<string, unknown> | null,
          }
        })),
        total: finalFiltered.length,
        pageCount: Math.ceil(finalFiltered.length / limit)
      };
    },
    [cacheKey],
    {
      tags: [`tenant-${tenantId}-inventory`],
      revalidate: 3600
    }
  )();
}

/**
 * Gets unique filters for the storefront.
 */
export async function getStorefrontFilters(tenantId: string) {
  return unstable_cache(
    async () => {
      const items = await prisma.inventoryItem.findMany({
        where: { tenantId, quantity: { gt: 0 } },
        select: { cardTemplate: { select: { metadata: true, set: true } } }
      });

      const colorSet = new Set<string>();
      const typeSet = new Set<string>();
      const setSet = new Set<string>();

      items.forEach((item) => {
        const meta = item.cardTemplate?.metadata as any;
        if (meta?.colors && Array.isArray(meta.colors)) {
          meta.colors.forEach((c: string) => colorSet.add(c));
        }
        if (meta?.type_line) {
          const mainType = meta.type_line.split("—")[0].trim().split(" ")[0];
          if (mainType) typeSet.add(mainType);
        }
        if (item.cardTemplate?.set) {
          setSet.add(item.cardTemplate.set.toUpperCase());
        }
      });

      return {
        colors: [...Array.from(colorSet).sort(), "C"],
        types: Array.from(typeSet).sort(),
        sets: Array.from(setSet).sort(),
      };
    },
    [`storefront-filters-${tenantId}`],
    {
      tags: [`tenant-${tenantId}-inventory`],
      revalidate: 3600
    }
  )();
}
