import { describe, it, expect } from "vitest";
import { getClientIp } from "@/lib/proxy/client-ip";

function makeRequest(headers: Record<string, string>) {
  return {
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
  } as unknown as Parameters<typeof getClientIp>[0];
}

describe("getClientIp", () => {
  it("returns the first entry of x-forwarded-for", () => {
    expect(
      getClientIp(makeRequest({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" })),
    ).toBe("1.1.1.1");
  });

  it("trims whitespace around the leading IP", () => {
    expect(
      getClientIp(makeRequest({ "x-forwarded-for": "  3.3.3.3 , 4.4.4.4" })),
    ).toBe("3.3.3.3");
  });

  it("falls back to x-real-ip when x-forwarded-for is empty", () => {
    expect(getClientIp(makeRequest({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("falls back to 'unknown' when neither header is set", () => {
    expect(getClientIp(makeRequest({}))).toBe("unknown");
  });

  it("ignores an x-forwarded-for that only contains whitespace", () => {
    expect(
      getClientIp(makeRequest({ "x-forwarded-for": "   ", "x-real-ip": "5.5.5.5" })),
    ).toBe("5.5.5.5");
  });
});
