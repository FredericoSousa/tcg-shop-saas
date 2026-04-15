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
  // Server-side implementation (Node.js)
  try {
    const { AsyncLocalStorage } = require("node:async_hooks");
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
    // Fallback for environments where require might fail despite being server-side
    implementation = {
      getCorrelationId: () => undefined,
      runWithCorrelationId: <T>(callback: () => T): T => callback(),
    };
  }
} else {
  // Browser or Edge implementation (Stubs)
  implementation = {
    getCorrelationId: () => undefined,
    runWithCorrelationId: <T>(callback: () => T, _id?: string): T => {
      // In the browser, we don't have AsyncLocalStorage, but we can still generate a UUID if needed
      // though it won't be persisted across calls like on the server.
      return callback();
    },
  };
}

export const getCorrelationId = implementation.getCorrelationId;
export const runWithCorrelationId = implementation.runWithCorrelationId;
