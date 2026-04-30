export interface OutboxEvent {
  id: string;
  tenantId: string | null;
  eventName: string;
  payload: unknown;
  createdAt: Date;
  processedAt: Date | null;
  attempts: number;
  lastError: string | null;
  deadLetteredAt: Date | null;
}

export interface IOutboxRepository {
  /** Append a new event in the *same* transaction as the state change. */
  enqueue(
    eventName: string,
    payload: unknown,
    tenantId: string | null,
    tx?: unknown,
  ): Promise<void>;
  /**
   * Pull a batch of unprocessed events for the worker. Excludes rows
   * already moved to the DLQ — those are visible only via `listDead`.
   */
  pickPending(limit: number): Promise<OutboxEvent[]>;
  /** Mark an event as successfully processed. */
  markProcessed(id: string): Promise<void>;
  /** Increment attempts + persist last error message after a failure. */
  recordFailure(id: string, error: string): Promise<void>;
  /** Stamp the event as dead-lettered so the worker stops looking at it. */
  markDeadLettered(id: string): Promise<void>;
  /** List dead-lettered rows for the admin UI / ops tooling. */
  listDead(limit: number): Promise<OutboxEvent[]>;
  /** Reset attempts/error on a dead-lettered row so it is picked up again. */
  requeue(id: string): Promise<void>;
  /** Count of pending and dead-lettered rows for monitoring. */
  stats(): Promise<{ pending: number; deadLettered: number }>;
}
