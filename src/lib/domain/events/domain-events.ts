import { logger } from "@/lib/logger";

type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

/**
 * Lightweight Domain Event Publisher
 * Optimized for Serverless (synchronous within the same execution context)
 */
class DomainEvents {
  private handlers: Map<string, EventHandler<unknown>[]> = new Map();

  /**
   * Register a handler for a specific event
   */
  subscribe<T = unknown>(eventName: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler as EventHandler<unknown>);
  }

  /**
   * Publish an event to all registered handlers
   */
  async publish<T>(eventName: string, data: T): Promise<void> {
    const eventHandlers = this.handlers.get(eventName) || [];

    if (eventHandlers.length === 0) {
      logger.debug(`No handlers for event: ${eventName}`);
      return;
    }

    logger.info(`Publishing event: ${eventName}`, { data });

    // Execute handlers. In serverless, we usually want to await them 
    // to ensure they finish before the Lambda terminates, unless 
    // offloaded to a queue.
    const results = await Promise.allSettled(
      eventHandlers.map(handler => handler(data))
    );

    results.forEach((result) => {
      if (result.status === 'rejected') {
        logger.error(`Error in handler for ${eventName}`, result.reason as Error);
      }
    });
  }

  /**
   * Clear all handlers (mainly for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}

export const domainEvents = new DomainEvents();

// Event Name Constants
export const DOMAIN_EVENTS = {
  ORDER_PLACED: 'order.placed',
  INVENTORY_UPDATED: 'inventory.updated',
  CUSTOMER_CREDIT_ADJUSTED: 'customer.credit_adjusted',
} as const;
