import { describe, it, expect } from "vitest";
import { mock } from "vitest-mock-extended";
import { CreateTenantUseCase } from "@/lib/application/use-cases/tenant/create-tenant.use-case";
import type { ITenantRepository } from "@/lib/domain/repositories/tenant.repository";
import type { Tenant } from "@/lib/domain/entities/tenant";
import { ConflictError, ValidationError } from "@/lib/domain/errors/domain.error";

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: "t-id",
    slug: "demo",
    name: "Demo",
    active: true,
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
    ...overrides,
  };
}

describe("CreateTenantUseCase", () => {
  it("creates a tenant with valid input", async () => {
    const repo = mock<ITenantRepository>();
    repo.findBySlug.mockResolvedValue(null);
    repo.create.mockResolvedValue(makeTenant({ slug: "loja-do-joao", name: "Loja do João" }));

    const useCase = new CreateTenantUseCase(repo);
    const result = await useCase.execute({ slug: "loja-do-joao", name: "Loja do João" });

    expect(repo.findBySlug).toHaveBeenCalledWith("loja-do-joao");
    expect(repo.create).toHaveBeenCalledWith({
      slug: "loja-do-joao",
      name: "Loja do João",
      email: null,
    });
    expect(result.slug).toBe("loja-do-joao");
  });

  it("rejects slugs with uppercase letters", async () => {
    const repo = mock<ITenantRepository>();
    const useCase = new CreateTenantUseCase(repo);

    await expect(
      useCase.execute({ slug: "Loja", name: "Loja" }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("rejects slugs starting or ending with hyphen", async () => {
    const repo = mock<ITenantRepository>();
    const useCase = new CreateTenantUseCase(repo);

    await expect(useCase.execute({ slug: "-foo", name: "Foo" })).rejects.toBeInstanceOf(ValidationError);
    await expect(useCase.execute({ slug: "foo-", name: "Foo" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects reserved slugs", async () => {
    const repo = mock<ITenantRepository>();
    const useCase = new CreateTenantUseCase(repo);

    await expect(useCase.execute({ slug: "internal", name: "X" })).rejects.toBeInstanceOf(ValidationError);
    await expect(useCase.execute({ slug: "admin", name: "X" })).rejects.toBeInstanceOf(ValidationError);
    await expect(useCase.execute({ slug: "www", name: "X" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects names shorter than 2 chars", async () => {
    const repo = mock<ITenantRepository>();
    const useCase = new CreateTenantUseCase(repo);

    await expect(useCase.execute({ slug: "ok", name: "x" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ConflictError when slug already exists", async () => {
    const repo = mock<ITenantRepository>();
    repo.findBySlug.mockResolvedValue(makeTenant({ slug: "taken" }));

    const useCase = new CreateTenantUseCase(repo);

    await expect(
      useCase.execute({ slug: "taken", name: "Outra Loja" }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("treats empty email string as undefined", async () => {
    const repo = mock<ITenantRepository>();
    repo.findBySlug.mockResolvedValue(null);
    repo.create.mockResolvedValue(makeTenant());

    const useCase = new CreateTenantUseCase(repo);
    await useCase.execute({ slug: "demo", name: "Demo", email: "" });

    expect(repo.create).toHaveBeenCalledWith({
      slug: "demo",
      name: "Demo",
      email: null,
    });
  });
});
