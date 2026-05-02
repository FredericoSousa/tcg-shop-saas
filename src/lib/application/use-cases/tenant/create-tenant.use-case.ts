import { injectable, inject } from "tsyringe";
import { z } from "zod";
import { TOKENS } from "@/lib/infrastructure/container";
import type { ITenantRepository } from "@/lib/domain/repositories/tenant.repository";
import { Tenant } from "@/lib/domain/entities/tenant";
import { IUseCase } from "../use-case.interface";
import { ConflictError, ValidationError } from "@/lib/domain/errors/domain.error";

const RESERVED_SLUGS = new Set(["www", "api", "admin", "internal", "auth", "login", "app", "static", "public"]);

export const tenantSlugSchema = z
  .string()
  .min(2, "Slug deve ter ao menos 2 caracteres")
  .max(40, "Slug deve ter no máximo 40 caracteres")
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Slug deve ser minúsculo, alfanumérico, podendo conter hífens (não inicial/final)")
  .refine((s) => !RESERVED_SLUGS.has(s), "Este slug é reservado");

export const createTenantSchema = z.object({
  slug: tenantSlugSchema,
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(120),
  email: z.email("Email inválido").optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});

export type CreateTenantRequest = z.input<typeof createTenantSchema>;

@injectable()
export class CreateTenantUseCase implements IUseCase<CreateTenantRequest, Tenant> {
  constructor(@inject(TOKENS.TenantRepository) private tenantRepo: ITenantRepository) {}

  async execute(request: CreateTenantRequest): Promise<Tenant> {
    const parsed = createTenantSchema.safeParse(request);
    if (!parsed.success) {
      throw new ValidationError(
        "Dados inválidos para criar tenant",
        parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      );
    }

    const { slug, name, email } = parsed.data;

    const existing = await this.tenantRepo.findBySlug(slug);
    if (existing) {
      throw new ConflictError(`Já existe um tenant com o slug "${slug}".`);
    }

    return this.tenantRepo.create({ slug, name, email: email ?? null });
  }
}
