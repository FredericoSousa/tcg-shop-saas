import { describe, it, expect, beforeEach } from "vitest";
import {
  CircuitBreaker,
  CircuitOpenError,
  retryWithBackoff,
} from "@/lib/resilience/circuit-breaker";

describe("CircuitBreaker", () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    cb = new CircuitBreaker({
      name: "test",
      failureThreshold: 3,
      windowMs: 1_000,
      cooldownMs: 50,
    });
  });

  it("returns successes while closed", async () => {
    const res = await cb.exec(async () => 42);
    expect(res).toBe(42);
    expect(cb.metrics().state).toBe("closed");
  });

  it("opens after the failure threshold and short-circuits subsequent calls", async () => {
    const fail = () => Promise.reject(new Error("boom"));
    for (let i = 0; i < 3; i += 1) {
      await expect(cb.exec(fail)).rejects.toThrow();
    }
    expect(cb.metrics().state).toBe("open");
    await expect(cb.exec(async () => 1)).rejects.toBeInstanceOf(CircuitOpenError);
  });

  it("uses the fallback when open instead of throwing", async () => {
    const fail = () => Promise.reject(new Error("boom"));
    // First two failures aren't enough to trip the breaker, so they
    // surface the underlying error.
    await expect(cb.exec(fail, () => "fallback")).rejects.toThrow(/boom/);
    await expect(cb.exec(fail, () => "fallback")).rejects.toThrow(/boom/);
    // Third failure flips state to open inside the same exec — fallback fires.
    await expect(cb.exec(fail, () => "fallback")).resolves.toBe("fallback");
    // Subsequent calls short-circuit straight to fallback.
    await expect(cb.exec(fail, () => "fallback")).resolves.toBe("fallback");
  });

  it("transitions open → half-open → closed on a successful probe", async () => {
    const fail = () => Promise.reject(new Error("boom"));
    for (let i = 0; i < 3; i += 1) {
      await expect(cb.exec(fail)).rejects.toThrow();
    }
    expect(cb.metrics().state).toBe("open");

    await new Promise(r => setTimeout(r, 60));
    const ok = await cb.exec(async () => "ok");
    expect(ok).toBe("ok");
    expect(cb.metrics().state).toBe("closed");
  });

  it("re-opens immediately if the half-open probe fails", async () => {
    const fail = () => Promise.reject(new Error("boom"));
    for (let i = 0; i < 3; i += 1) {
      await expect(cb.exec(fail)).rejects.toThrow();
    }
    await new Promise(r => setTimeout(r, 60));
    await expect(cb.exec(fail)).rejects.toThrow();
    expect(cb.metrics().state).toBe("open");
  });
});

describe("retryWithBackoff", () => {
  it("returns the first success without retrying", async () => {
    let calls = 0;
    const result = await retryWithBackoff(
      async () => {
        calls += 1;
        return "ok";
      },
      { attempts: 3, baseMs: 1, maxMs: 5 },
    );
    expect(result).toBe("ok");
    expect(calls).toBe(1);
  });

  it("retries up to attempts then throws the last error", async () => {
    let calls = 0;
    await expect(
      retryWithBackoff(
        async () => {
          calls += 1;
          throw new Error("nope");
        },
        { attempts: 3, baseMs: 1, maxMs: 5 },
      ),
    ).rejects.toThrow("nope");
    expect(calls).toBe(3);
  });

  it("aborts immediately when isRetriable returns false", async () => {
    let calls = 0;
    await expect(
      retryWithBackoff(
        async () => {
          calls += 1;
          throw new Error("permanent");
        },
        {
          attempts: 5,
          baseMs: 1,
          maxMs: 5,
          isRetriable: () => false,
        },
      ),
    ).rejects.toThrow("permanent");
    expect(calls).toBe(1);
  });
});
