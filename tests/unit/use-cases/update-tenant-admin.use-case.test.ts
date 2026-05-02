import { describe, it, expect } from "vitest";
import { mock } from "vitest-mock-extended";
import { UpdateTenantAdminUseCase } from "@/lib/application/use-cases/tenant/update-tenant-admin.use-case";
import type { ITenantRepository } from "@/lib/domain/repositories/tenant.repository";
import type { Tenant } from "@/lib/domain/entities/tenant";
import {
  EntityNotFoundError,
  ValidationError,
} from "@/lib/domain/errors/domain.error";

const VALID_ID = "11111111-1111-4111-8111-111111111111";

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: VALID_ID,
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

describe("UpdateTenantAdminUseCase", () => {
  it("updates only the fields provided", async () => {
    const repo = mock<ITenantRepository>();
    repo.findById.mockResolvedValue(makeTenant());
    repo.update.mockResolvedValue(makeTenant({ name: "Novo Nome" }));

    const useCase = new UpdateTenantAdminUseCase(repo);
    await useCase.execute({ id: VALID_ID, name: "Novo Nome" });

    expect(repo.update).toHaveBeenCalledWith(VALID_ID, { name: "Novo Nome" });
  });

  it("toggles active flag", async () => {
    const repo = mock<ITenantRepository>();
    repo.findById.mockResolvedValue(makeTenant());
    repo.update.mockResolvedValue(makeTenant({ active: false }));

    const useCase = new UpdateTenantAdminUseCase(repo);
    await useCase.execute({ id: VALID_ID, active: false });

    expect(repo.update).toHaveBeenCalledWith(VALID_ID, { active: false });
  });

  it("clears optional fields when sent as empty strings", async () => {
    const repo = mock<ITenantRepository>();
    repo.findById.mockResolvedValue(makeTenant({ phone: "999" }));
    repo.update.mockResolvedValue(makeTenant({ phone: null }));

    const useCase = new UpdateTenantAdminUseCase(repo);
    await useCase.execute({ id: VALID_ID, phone: "" });

    expect(repo.update).toHaveBeenCalledWith(VALID_ID, { phone: null });
  });

  it("returns existing tenant unchanged when no mutable fields are provided", async () => {
    const repo = mock<ITenantRepository>();
    const existing = makeTenant();
    repo.findById.mockResolvedValue(existing);

    const useCase = new UpdateTenantAdminUseCase(repo);
    const result = await useCase.execute({ id: VALID_ID });

    expect(result).toBe(existing);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("throws EntityNotFoundError when tenant does not exist", async () => {
    const repo = mock<ITenantRepository>();
    repo.findById.mockResolvedValue(null);

    const useCase = new UpdateTenantAdminUseCase(repo);

    await expect(
      useCase.execute({ id: VALID_ID, name: "Loja Nova" }),
    ).rejects.toBeInstanceOf(EntityNotFoundError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("throws ValidationError on invalid id", async () => {
    const repo = mock<ITenantRepository>();
    const useCase = new UpdateTenantAdminUseCase(repo);

    await expect(
      useCase.execute({ id: "not-a-uuid", name: "X" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
