/**
 * Canonical cache-tag names for Next 16 `cacheTag` / `revalidateTag`.
 *
 * All cached reads (Server Components with `'use cache'`, route
 * handlers using `unstable_cache`) should pull tags from here so that
 * the matching mutations bust them by name rather than by URL path.
 */

export const cacheTags = {
  /** Tenant settings + branding. */
  tenant: (tenantId: string) => `tenant-${tenantId}`,

  /** Storefront-visible inventory listing for one tenant. */
  inventory: (tenantId: string) => `inventory-${tenantId}`,

  /** Storefront-visible products (non-singles) for one tenant. */
  products: (tenantId: string) => `products-${tenantId}`,

  /** Admin order list and details for one tenant. */
  orders: (tenantId: string) => `orders-${tenantId}`,

  /** Buylist offers shown publicly. */
  buylist: (tenantId: string) => `buylist-${tenantId}`,
} as const;

export type CacheTagFactory = (typeof cacheTags)[keyof typeof cacheTags];
