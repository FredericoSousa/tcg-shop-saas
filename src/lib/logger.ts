/**
 * Structured logging utility for better debugging and tracking
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  action?: string;
  userId?: string;
  tenantId?: string;
  duration?: number;
  itemsProcessed?: number;
  [key: string]: any;
}

class Logger {
  private isDev = process.env.NODE_ENV === "development";

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage("info", message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage("warn", message, context));
  }

  error(message: string, error?: Error | string, context?: LogContext): void {
    const errorMsg =
      error instanceof Error ? error.message : String(error || "");
    const fullContext = { ...context, error: errorMsg };
    console.error(this.formatMessage("error", message, fullContext));
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
