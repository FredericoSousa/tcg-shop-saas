import { logger } from "@/lib/logger";

export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerOptions {
  /** Distinct name used in logs and the registry. */
  name: string;
  /** Failures within `windowMs` before tripping open. */
  failureThreshold: number;
  /** Sliding-window length used to count failures. */
  windowMs: number;
  /** How long to stay open before allowing a probe call. */
  cooldownMs: number;
}

interface CircuitMetrics {
  state: CircuitState;
  failures: number;
  openedAt: number | null;
}

/**
 * Minimal circuit breaker — closed → open → half-open → closed/open.
 *
 * Why hand-rolled: only one external dependency (Scryfall) needs this
 * today; pulling `opossum` adds a worker-thread + timer machinery we
 * don't need. A Map of timestamps is enough for failure-rate sliding
 * windows at our request volume.
 */
export class CircuitBreaker {
  private readonly options: CircuitBreakerOptions;
  private failures: number[] = [];
  private state: CircuitState = "closed";
  private openedAt: number | null = null;

  constructor(options: CircuitBreakerOptions) {
    this.options = options;
  }

  async exec<T>(fn: () => Promise<T>, fallback?: () => T | Promise<T>): Promise<T> {
    this.advanceState();

    if (this.state === "open") {
      logger.warn(`Circuit ${this.options.name} OPEN — short-circuiting`, {
        action: "circuit_short_circuit",
        circuit: this.options.name,
      });
      if (fallback) return await fallback();
      throw new CircuitOpenError(this.options.name);
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure();
      // recordFailure may have flipped state to "open"; cast through
      // CircuitState because TS still has it narrowed from the earlier
      // guard.
      if (fallback && (this.state as CircuitState) === "open") {
        return await fallback();
      }
      throw err;
    }
  }

  metrics(): CircuitMetrics {
    return {
      state: this.state,
      failures: this.failures.length,
      openedAt: this.openedAt,
    };
  }

  /** Test seam: jump back to clean state. */
  reset(): void {
    this.failures = [];
    this.state = "closed";
    this.openedAt = null;
  }

  private advanceState(): void {
    const now = Date.now();
    this.failures = this.failures.filter((t) => now - t <= this.options.windowMs);

    if (this.state === "open" && this.openedAt != null && now - this.openedAt >= this.options.cooldownMs) {
      this.state = "half-open";
      logger.info(`Circuit ${this.options.name} → HALF-OPEN`, {
        action: "circuit_half_open",
        circuit: this.options.name,
      });
    }
  }

  private recordSuccess(): void {
    if (this.state === "half-open") {
      this.state = "closed";
      this.failures = [];
      this.openedAt = null;
      logger.info(`Circuit ${this.options.name} → CLOSED`, {
        action: "circuit_closed",
        circuit: this.options.name,
      });
    }
  }

  private recordFailure(): void {
    const now = Date.now();
    this.failures.push(now);
    this.failures = this.failures.filter((t) => now - t <= this.options.windowMs);

    if (
      this.state === "half-open" ||
      this.failures.length >= this.options.failureThreshold
    ) {
      this.state = "open";
      this.openedAt = now;
      logger.error(
        `Circuit ${this.options.name} → OPEN (${this.failures.length} failures in window)`,
        new Error("circuit_open"),
        { action: "circuit_open", circuit: this.options.name },
      );
    }
  }
}

export class CircuitOpenError extends Error {
  constructor(name: string) {
    super(`Circuit ${name} is open`);
    this.name = "CircuitOpenError";
  }
}

/**
 * Retry with exponential backoff and full jitter. Aborts on
 * non-retriable conditions (caller-decided via `isRetriable`).
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  opts: {
    attempts: number;
    baseMs: number;
    maxMs: number;
    isRetriable?: (err: unknown) => boolean;
  },
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < opts.attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (opts.isRetriable && !opts.isRetriable(err)) throw err;
      if (i === opts.attempts - 1) break;
      const cap = Math.min(opts.maxMs, opts.baseMs * 2 ** i);
      const delay = Math.floor(Math.random() * cap);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
