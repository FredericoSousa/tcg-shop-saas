import { AsyncLocalStorage } from "async_hooks";
import { headers } from "next/headers";

export const tenantContext = new AsyncLocalStorage<string>();

export function getTenantId(): string | undefined {
  return tenantContext.getStore();
}

/**
 * Async variant that falls back to reading `x-tenant-id` from the request headers
 * when the AsyncLocalStorage store is empty. `AsyncLocalStorage.enterWith()` does
 * not propagate through React's RSC rendering boundaries, so pages/layouts cannot
 * rely on ALS alone — this helper uses Next's request-scoped `headers()` storage
 * which does work in RSC.
 */
export async function resolveTenantId(): Promise<string | undefined> {
  const fromStore = tenantContext.getStore();
  if (fromStore) return fromStore;
  try {
    const h = await headers();
    return h.get("x-tenant-id") ?? undefined;
  } catch {
    return undefined;
  }
}

export function runWithTenant<T>(tenantId: string, callback: () => T): T {
  return tenantContext.run(tenantId, callback);
}

export function enterTenantContext(tenantId: string): void {
  tenantContext.enterWith(tenantId);
}
