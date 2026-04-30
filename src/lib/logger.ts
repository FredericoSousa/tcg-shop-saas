import { getCorrelationId } from "./correlation-context";

/**
 * Structured logging utility for better debugging and tracking.
 * Outputs human-readable strings in development and JSON in production
 * for structured log ingestion (Datadog, CloudWatch, etc.).
 *
 * PII redaction is applied to common sensitive keys before any
 * value crosses the process boundary (stdout, Sentry, …).
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  action?: string;
  userId?: string;
  tenantId?: string;
  duration?: number;
  itemsProcessed?: number;
  correlationId?: string;
  [key: string]: unknown;
}

type ErrorReporter = (error: Error, context?: LogContext) => void;

let errorReporter: ErrorReporter | null = null;

export function setErrorReporter(reporter: ErrorReporter): void {
  errorReporter = reporter;
}

const PII_KEYS = new Set([
  "phoneNumber",
  "phone",
  "email",
  "password",
  "creditCard",
  "cardNumber",
  "cvv",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
]);

const REDACTED = "[REDACTED]";
const MAX_DEPTH = 4;

function redact(value: unknown, depth = 0): unknown {
  if (value == null || depth > MAX_DEPTH) return value;

  if (Array.isArray(value)) {
    return value.map(v => redact(v, depth + 1));
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (PII_KEYS.has(k)) {
        out[k] = typeof v === "string" && v.length > 0 ? maskValue(v) : REDACTED;
      } else {
        out[k] = redact(v, depth + 1);
      }
    }
    return out;
  }

  return value;
}

function maskValue(value: string): string {
  if (value.length <= 4) return REDACTED;
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

class Logger {
  private isDev = process.env.NODE_ENV === "development";

  private formatDev(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private formatProd(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...context,
    });
  }

  private format(level: LogLevel, message: string, context?: LogContext): string {
    const correlationId = getCorrelationId();
    const merged = {
      ...context,
      ...(correlationId ? { correlationId } : {}),
    };
    const finalContext = redact(merged) as LogContext;

    return this.isDev
      ? this.formatDev(level, message, finalContext)
      : this.formatProd(level, message, finalContext);
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.debug(this.format("debug", message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.log(this.format("info", message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.format("warn", message, context));
  }

  error(message: string, error?: Error | string, context?: LogContext): void {
    const errorMsg =
      error instanceof Error ? error.message : String(error || "");
    const stack = error instanceof Error ? error.stack : undefined;
    const fullContext = { ...context, error: errorMsg, ...(stack && !this.isDev ? { stack } : {}) };
    console.error(this.format("error", message, fullContext));

    if (errorReporter && error instanceof Error) {
      try {
        const correlationId = getCorrelationId() ?? undefined;
        errorReporter(error, redact({
          ...context,
          message,
          correlationId,
        }) as LogContext);
      } catch {
        // never let the reporter crash the app
      }
    }
  }
}

export const logger = new Logger();

/**
 * Utility to measure execution time
 */
export function createTimer(label: string) {
  const startTime = Date.now();
  return {
    elapsed: () => Date.now() - startTime,
    log: (context?: LogContext) => {
      const duration = Date.now() - startTime;
      logger.info(`${label} completed`, { ...context, duration });
      return duration;
    },
  };
}
