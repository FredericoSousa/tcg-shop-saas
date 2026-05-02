import { describe, it, expect } from "vitest";
import { mock } from "vitest-mock-extended";
import { ListTenantsUseCase } from "@/lib/application/use-cases/tenant/list-tenants.use-case";
import type { ITenantRepository } from "@/lib/domain/repositories/tenant.repository";
import type { Tenant } from "@/lib/domain/entities/tenant";

function tenant(slug: string, active = true): Tenant {
  return {
    id: `id-${slug}`,
    slug,
    name: `Loja ${slug}`,
    active,
    logoUrl: null,
    faviconUrl: null,
    description: null,
    address: null,
    phone: null,
    email: null,
    instagram: null,
    whatsapp: null,
    facebook: null,
    twitter: null,
    brandColor: null,
    webhookUrl: null,
    webhookSecret: null,
  };
}

describe("ListTenantsUseCase", () => {
  it("forwards pagination and search to the repository", async () => {
    const repo = mock<ITenantRepository>();
    repo.list.mockResolvedValue({ items: [tenant("a"), tenant("b")], total: 2 });

    const useCase = new ListTenantsUseCase(repo);
    const result = await useCase.execute({ page: 2, limit: 10, search: "a" });

    expect(repo.list).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: "a",
      active: undefined,
    });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.pageCount).toBe(1);
  });

  it("clamps page to >= 1 and limit to (0, 100]", async () => {
    const repo = mock<ITenantRepository>();
    repo.list.mockResolvedValue({ items: [], total: 0 });

    const useCase = new ListTenantsUseCase(repo);
    await useCase.execute({ page: -5, limit: 1000 });

    expect(repo.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 100 }),
    );
  });

  it("returns pageCount=1 even when total is zero", async () => {
    const repo = mock<ITenantRepository>();
    repo.list.mockResolvedValue({ items: [], total: 0 });

    const useCase = new ListTenantsUseCase(repo);
    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.pageCount).toBe(1);
  });

  it("calculates pageCount from total/limit", async () => {
    const repo = mock<ITenantRepository>();
    repo.list.mockResolvedValue({ items: [], total: 25 });

    const useCase = new ListTenantsUseCase(repo);
    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.pageCount).toBe(3);
  });
});
