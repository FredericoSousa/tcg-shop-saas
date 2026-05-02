import { describe, it, expect } from "vitest";
import { getAppMetadata, getUserTenantId, isSuperAdmin } from "@/lib/supabase/user-metadata";
import type { User } from "@supabase/supabase-js";

function user(meta: unknown): Pick<User, "app_metadata"> {
  return { app_metadata: meta as User["app_metadata"] };
}

describe("getAppMetadata", () => {
  it("extracts tenantId and role when both are valid", () => {
    expect(getAppMetadata(user({ tenantId: "t1", role: "ADMIN" }))).toEqual({
      tenantId: "t1",
      role: "ADMIN",
    });
  });

  it("drops a non-string tenantId", () => {
    expect(getAppMetadata(user({ tenantId: 123, role: "USER" }))).toEqual({
      tenantId: undefined,
      role: "USER",
    });
  });

  it("drops an unknown role value", () => {
    expect(getAppMetadata(user({ tenantId: "t1", role: "OWNER" }))).toEqual({
      tenantId: "t1",
      role: undefined,
    });
  });

  it("returns an empty object for null users", () => {
    expect(getAppMetadata(null)).toEqual({});
    expect(getAppMetadata(undefined)).toEqual({});
  });

  it("returns an empty object when app_metadata is not an object", () => {
    expect(getAppMetadata(user("oops"))).toEqual({});
  });
});

describe("getUserTenantId", () => {
  it("returns the tenantId from app_metadata", () => {
    expect(getUserTenantId(user({ tenantId: "t-7" }))).toBe("t-7");
  });

  it("returns undefined when not present", () => {
    expect(getUserTenantId(user({}))).toBeUndefined();
    expect(getUserTenantId(null)).toBeUndefined();
  });
});

describe("SUPER_ADMIN role", () => {
  it("accepts SUPER_ADMIN as a valid role", () => {
    expect(getAppMetadata(user({ role: "SUPER_ADMIN" }))).toEqual({
      tenantId: undefined,
      role: "SUPER_ADMIN",
    });
  });

  it("isSuperAdmin returns true only for SUPER_ADMIN", () => {
    expect(isSuperAdmin(user({ role: "SUPER_ADMIN" }))).toBe(true);
    expect(isSuperAdmin(user({ role: "ADMIN" }))).toBe(false);
    expect(isSuperAdmin(user({ role: "USER" }))).toBe(false);
    expect(isSuperAdmin(user({}))).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
  });
});
