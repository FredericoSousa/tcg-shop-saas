import { config } from "./lib/config";
import { setErrorReporter } from "./lib/logger";

interface SentryLike {
  init: (options: Record<string, unknown>) => void;
  captureException: (
    error: unknown,
    context?: {
      extra?: Record<string, unknown>;
      tags?: Record<string, string>;
      level?: string;
    },
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

  // Promote tenant/correlation IDs from log context to Sentry tags so
  // multi-tenant triage and trace stitching work without bespoke
  // Sentry SDK wiring at every call-site.
  setErrorReporter((err, ctx) => {
    const tags: Record<string, string> = {};
    if (typeof ctx?.tenantId === "string") tags.tenantId = ctx.tenantId;
    if (typeof ctx?.correlationId === "string") tags.correlationId = ctx.correlationId;
    if (typeof ctx?.action === "string") tags.action = ctx.action;
    const risk = ctx?.risk;
    const level = typeof risk === "string" && risk === "oversell" ? "fatal" : undefined;

    Sentry!.captureException(err, {
      tags,
      level,
      extra: ctx as Record<string, unknown>,
    });
  });
}
