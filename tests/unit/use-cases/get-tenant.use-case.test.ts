import { describe, it, expect } from "vitest";
import { mock } from "vitest-mock-extended";
import { GetTenantUseCase } from "@/lib/application/use-cases/tenant/get-tenant.use-case";
import type { ITenantRepository } from "@/lib/domain/repositories/tenant.repository";
import type { Tenant } from "@/lib/domain/entities/tenant";

const tenant = { id: "t1", slug: "demo", name: "Demo" } as unknown as Tenant;

describe("GetTenantUseCase", () => {
  it("looks up by id when id is provided", async () => {
    const repo = mock<ITenantRepository>();
    repo.findById.mockResolvedValue(tenant);
    const useCase = new GetTenantUseCase(repo);
    await expect(useCase.execute({ id: "t1" })).resolves.toBe(tenant);
    expect(repo.findById).toHaveBeenCalledWith("t1");
    expect(repo.findBySlug).not.toHaveBeenCalled();
  });

  it("looks up by slug when only slug is provided", async () => {
    const repo = mock<ITenantRepository>();
    repo.findBySlug.mockResolvedValue(tenant);
    const useCase = new GetTenantUseCase(repo);
    await expect(useCase.execute({ slug: "demo" })).resolves.toBe(tenant);
    expect(repo.findBySlug).toHaveBeenCalledWith("demo");
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it("returns null when neither id nor slug is provided", async () => {
    const repo = mock<ITenantRepository>();
    const useCase = new GetTenantUseCase(repo);
    await expect(useCase.execute({})).resolves.toBeNull();
    expect(repo.findById).not.toHaveBeenCalled();
    expect(repo.findBySlug).not.toHaveBeenCalled();
  });
});
