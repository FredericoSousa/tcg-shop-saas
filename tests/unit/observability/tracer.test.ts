import { describe, it, expect } from "vitest";
import {
  withSpan,
  setSpanAttributes,
  addSpanEvent,
  getTraceContext,
} from "@/lib/observability/tracer";

describe("tracer (no SDK registered)", () => {
  it("withSpan returns the function value", async () => {
    const result = await withSpan("test", { foo: "bar" }, async () => 42);
    expect(result).toBe(42);
  });

  it("withSpan re-throws errors after recording", async () => {
    await expect(
      withSpan("test", undefined, async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });

  it("setSpanAttributes/addSpanEvent are no-ops when no span is active", () => {
    expect(() => setSpanAttributes({ k: "v" })).not.toThrow();
    expect(() => addSpanEvent("e", { k: "v" })).not.toThrow();
  });

  it("getTraceContext returns an empty object when no span is active", () => {
    expect(getTraceContext()).toEqual({});
  });
});
