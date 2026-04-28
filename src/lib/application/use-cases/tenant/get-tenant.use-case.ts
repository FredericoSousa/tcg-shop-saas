import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../../infrastructure/container";
import type { ITenantRepository } from "@/lib/domain/repositories/tenant.repository";
import { Tenant } from "@/lib/domain/entities/tenant";
import { IUseCase } from "../use-case.interface";

export interface GetTenantRequest {
  id?: string;
  slug?: string;
}

@injectable()
export class GetTenantUseCase implements IUseCase<GetTenantRequest, Tenant | null> {
  constructor(@inject(TOKENS.TenantRepository) private tenantRepo: ITenantRepository) {}

  async execute(request: GetTenantRequest): Promise<Tenant | null> {
    if (request.id) {
      return this.tenantRepo.findById(request.id);
    }
    if (request.slug) {
      return this.tenantRepo.findBySlug(request.slug);
    }
    return null;
  }
}
