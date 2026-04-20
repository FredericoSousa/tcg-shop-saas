/**
 * Correlation ID context using AsyncLocalStorage.
 * This file is browser-safe and will return undefined on the client.
 */

interface ICorrelationContext {
  getCorrelationId(): string | undefined;
  runWithCorrelationId<T>(callback: () => T, id?: string): T;
}

let implementation: ICorrelationContext;

if (typeof window === "undefined" && process.env.NEXT_RUNTIME !== "edge") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AsyncLocalStorage } = require("node:async_hooks");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { randomUUID } = require("node:crypto");
    const correlationContext = new AsyncLocalStorage();

    implementation = {
      getCorrelationId: () => correlationContext.getStore() as string | undefined,
      runWithCorrelationId: <T>(callback: () => T, id?: string): T => {
        const correlationId = id || (randomUUID() as string);
        return correlationContext.run(correlationId, callback);
      },
    };
  } catch {
    implementation = {
      getCorrelationId: () => undefined,
      runWithCorrelationId: <T>(callback: () => T): T => callback(),
    };
  }
} else {
  implementation = {
    getCorrelationId: () => undefined,
    runWithCorrelationId: <T>(callback: () => T): T => callback(),
  };
}

export const getCorrelationId = implementation.getCorrelationId;
export const runWithCorrelationId = implementation.runWithCorrelationId;
