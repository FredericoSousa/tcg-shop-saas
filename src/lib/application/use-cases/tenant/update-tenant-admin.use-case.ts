import { injectable, inject } from "tsyringe";
import { z } from "zod";
import { TOKENS } from "@/lib/infrastructure/container";
import type { ITenantRepository } from "@/lib/domain/repositories/tenant.repository";
import { Tenant } from "@/lib/domain/entities/tenant";
import { IUseCase } from "../use-case.interface";
import { EntityNotFoundError, ValidationError } from "@/lib/domain/errors/domain.error";

// Empty string => "clear this field" (null). Undefined => leave untouched.
const nullableString = (max: number) =>
  z
    .string()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .optional();

const nullableEmail = z
  .string()
  .max(255)
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || /.+@.+\..+/.test(v ?? ""), { message: "Email inválido" })
  .optional();

export const updateTenantAdminSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(120).optional(),
  active: z.boolean().optional(),
  email: nullableEmail,
  phone: nullableString(40),
  description: nullableString(500),
});

export type UpdateTenantAdminRequest = z.input<typeof updateTenantAdminSchema>;

/**
 * Super-admin level tenant update. Unlike `UpdateSettingsUseCase`, this can
 * toggle `active` and is meant to be used from the /internal panel.
 */
@injectable()
export class UpdateTenantAdminUseCase
  implements IUseCase<UpdateTenantAdminRequest, Tenant>
{
  constructor(@inject(TOKENS.TenantRepository) private tenantRepo: ITenantRepository) {}

  async execute(request: UpdateTenantAdminRequest): Promise<Tenant> {
    const parsed = updateTenantAdminSchema.safeParse(request);
    if (!parsed.success) {
      throw new ValidationError(
        "Dados inválidos para atualizar tenant",
        parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      );
    }

    const { id, ...rest } = parsed.data;

    const existing = await this.tenantRepo.findById(id);
    if (!existing) {
      throw new EntityNotFoundError("Tenant", id);
    }

    const updateData: Partial<Tenant> = {};
    if (rest.name !== undefined) updateData.name = rest.name;
    if (rest.active !== undefined) updateData.active = rest.active;
    if (rest.email !== undefined) updateData.email = rest.email;
    if (rest.phone !== undefined) updateData.phone = rest.phone;
    if (rest.description !== undefined) updateData.description = rest.description;

    if (Object.keys(updateData).length === 0) return existing;

    return this.tenantRepo.update(id, updateData);
  }
}
