import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { ITenantRepository } from "@/lib/domain/repositories/tenant.repository";
import { Tenant } from "@/lib/domain/entities/tenant";
import { IUseCase } from "../use-case.interface";

@injectable()
export class UpdateSettingsUseCase implements IUseCase<{ id: string; data: Partial<Tenant> }, Tenant> {
  constructor(@inject(TOKENS.TenantRepository) private tenantRepo: ITenantRepository) {}

  async execute(request: { id: string; data: Partial<Tenant> }): Promise<Tenant> {
    const { id, data } = request;
    const allowedFields: (keyof Tenant)[] = [
      "name", "logoUrl", "faviconUrl", "description", "address", 
      "phone", "email", "instagram", "whatsapp", "facebook", "twitter"
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field as string] = data[field];
      }
    }

    return this.tenantRepo.update(id, updateData as Partial<Tenant>);
  }
}
