import { getCorrelationId } from "./correlation-context";

/**
 * Structured logging utility for better debugging and tracking.
 * Outputs human-readable strings in development and JSON in production
 * for structured log ingestion (Datadog, CloudWatch, etc.).
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
    const finalContext = { ...context, ...(correlationId ? { correlationId } : {}) };

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

