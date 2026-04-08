import { AsyncLocalStorage } from "async_hooks";

export const tenantContext = new AsyncLocalStorage<string>();

export function getTenantId(): string | undefined {
  return tenantContext.getStore();
}

export function runWithTenant<T>(tenantId: string, callback: () => T): T {
  return tenantContext.run(tenantId, callback);
}
