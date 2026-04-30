import { trace, context, SpanStatusCode, type Span, type Attributes } from "@opentelemetry/api";

const TRACER_NAME = "tcg-shop-saas";

/**
 * Start a span around `fn`. The span ends automatically when the
 * promise settles. Errors are recorded with `setStatus(ERROR)` and
 * re-thrown so caller error handling is unchanged.
 *
 * If no OTel SDK is registered (the @opentelemetry/api default state),
 * `tracer.startSpan` returns a non-recording span — costs are nil.
 * Wire an SDK + exporter in `instrumentation.ts` to enable export.
 */
export async function withSpan<T>(
  name: string,
  attributes: Attributes | undefined,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const tracer = trace.getTracer(TRACER_NAME);
  const span = tracer.startSpan(name, { attributes });
  try {
    return await context.with(trace.setSpan(context.active(), span), () => fn(span));
  } catch (err) {
    span.recordException(err as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (err as Error).message,
    });
    throw err;
  } finally {
    span.end();
  }
}

/** Add attributes to the currently active span, if any. */
export function setSpanAttributes(attrs: Attributes): void {
  const span = trace.getActiveSpan();
  if (span) span.setAttributes(attrs);
}

/** Record a named event on the active span (e.g. `cache_hit`). */
export function addSpanEvent(name: string, attrs?: Attributes): void {
  const span = trace.getActiveSpan();
  if (span) span.addEvent(name, attrs);
}

/** Get the W3C traceparent value for outbound HTTP propagation. */
export function getTraceContext(): { traceId?: string; spanId?: string } {
  const span = trace.getActiveSpan();
  if (!span) return {};
  const ctx = span.spanContext();
  return { traceId: ctx.traceId, spanId: ctx.spanId };
}
