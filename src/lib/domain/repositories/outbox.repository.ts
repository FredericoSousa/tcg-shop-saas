export interface OutboxEvent {
  id: string;
  tenantId: string | null;
  eventName: string;
  payload: unknown;
  createdAt: Date;
  processedAt: Date | null;
  attempts: number;
  lastError: string | null;
}

export interface IOutboxRepository {
  /** Append a new event in the *same* transaction as the state change. */
  enqueue(
    eventName: string,
    payload: unknown,
    tenantId: string | null,
    tx?: unknown,
  ): Promise<void>;
  /** Pull a batch of unprocessed events for the worker. */
  pickPending(limit: number): Promise<OutboxEvent[]>;
  /** Mark an event as successfully processed. */
  markProcessed(id: string): Promise<void>;
  /** Increment attempts + persist last error message after a failure. */
  recordFailure(id: string, error: string): Promise<void>;
}
