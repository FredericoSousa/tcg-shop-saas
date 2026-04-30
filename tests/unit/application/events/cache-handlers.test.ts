import { describe, it, expect, beforeEach, vi } from "vitest";

const revalidateTagMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTagMock(...args),
}));

import { handleInventoryCacheInvalidation } from "@/lib/application/events/cache-handlers";

describe("handleInventoryCacheInvalidation", () => {
  beforeEach(() => {
    revalidateTagMock.mockReset();
  });

  it("revalidates the tenant-scoped inventory tag", async () => {
    await handleInventoryCacheInvalidation({
      tenantId: "t1",
      inventoryIds: ["i1"],
      source: "test",
    });
    expect(revalidateTagMock).toHaveBeenCalledWith("tenant-t1-inventory", "default");
  });

  it("is a no-op when tenantId is missing", async () => {
    await handleInventoryCacheInvalidation({
      tenantId: "",
      inventoryIds: ["i1"],
    } as never);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("swallows revalidateTag errors so the bus stays running", async () => {
    revalidateTagMock.mockImplementation(() => {
      throw new Error("not in request context");
    });
    await expect(
      handleInventoryCacheInvalidation({ tenantId: "t1", inventoryIds: ["i1"] }),
    ).resolves.toBeUndefined();
  });
});
