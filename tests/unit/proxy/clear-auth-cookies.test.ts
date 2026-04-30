import { describe, it, expect } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/proxy/clear-auth-cookies";

function makeRequestWithCookies(cookies: Record<string, string>): NextRequest {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  return new NextRequest("http://example.com/", {
    headers: { cookie: cookieHeader },
  });
}

describe("clearAuthCookies", () => {
  it("zeroes every cookie that starts with 'sb-'", () => {
    const req = makeRequestWithCookies({
      "sb-access-token": "x",
      "sb-refresh-token": "y",
      analytics: "kept",
    });
    const res = clearAuthCookies(req, NextResponse.next());

    const setCookies = res.cookies.getAll();
    const sbNames = setCookies.filter(c => c.name.startsWith("sb-")).map(c => c.name);
    expect(sbNames.sort()).toEqual(["sb-access-token", "sb-refresh-token"]);
    expect(setCookies.find(c => c.name === "analytics")).toBeUndefined();
    expect(res.cookies.get("sb-access-token")?.value).toBe("");
  });

  it("is a no-op when no auth cookies are present", () => {
    const req = makeRequestWithCookies({ analytics: "v" });
    const res = clearAuthCookies(req, NextResponse.next());
    expect(res.cookies.getAll().filter(c => c.name.startsWith("sb-"))).toHaveLength(0);
  });
});
