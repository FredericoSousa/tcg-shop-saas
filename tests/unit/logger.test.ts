import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { logger, setErrorReporter } from "@/lib/logger";

describe("logger redaction", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    logSpy.mockRestore();
    errSpy.mockRestore();
    setErrorReporter(() => undefined);
  });

  it("masks PII keys in info context", () => {
    logger.info("created", { phoneNumber: "11999998888", email: "user@x.com" });
    const out = String(logSpy.mock.calls[0][0]);
    expect(out).not.toContain("11999998888");
    expect(out).not.toContain("user@x.com");
    // Mask preserves length signal but redacts middle.
    expect(out).toContain("***");
  });

  it("redacts password and token even when nested", () => {
    logger.info("nested", {
      payload: { credentials: { password: "supersecret", token: "abc-token" } },
    });
    const out = String(logSpy.mock.calls[0][0]);
    expect(out).not.toContain("supersecret");
    expect(out).not.toContain("abc-token");
  });

  it("forwards redacted context to the error reporter", () => {
    const reporter = vi.fn();
    setErrorReporter(reporter);

    logger.error("boom", new Error("x"), { phoneNumber: "11999998888" });

    expect(reporter).toHaveBeenCalled();
    const ctx = reporter.mock.calls[0][1];
    expect(JSON.stringify(ctx)).not.toContain("11999998888");
  });
});
