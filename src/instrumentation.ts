import { config } from "./lib/config";
import { setErrorReporter } from "./lib/logger";

interface SentryLike {
  init: (options: Record<string, unknown>) => void;
  captureException: (
    error: unknown,
    context?: { extra?: Record<string, unknown> },
  ) => void;
}

export async function register() {
  const dsn = config.sentry.serverDsn;
  if (!dsn) return;

  const moduleName = "@sentry/nextjs";
  let Sentry: SentryLike | null = null;
  try {
    Sentry = (await import(/* webpackIgnore: true */ moduleName)) as SentryLike;
  } catch {
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: config.isProduction ? "production" : "development",
  });

  setErrorReporter((err, ctx) => {
    Sentry!.captureException(err, { extra: ctx as Record<string, unknown> });
  });
}
