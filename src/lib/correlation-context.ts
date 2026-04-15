import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";

export const correlationContext = new AsyncLocalStorage<string>();

export function getCorrelationId(): string | undefined {
  return correlationContext.getStore();
}

export function runWithCorrelationId<T>(callback: () => T, id?: string): T {
  const correlationId = id || randomUUID();
  return correlationContext.run(correlationId, callback);
}
