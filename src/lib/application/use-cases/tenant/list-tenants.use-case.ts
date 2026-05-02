import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { ITenantRepository } from "@/lib/domain/repositories/tenant.repository";
import { Tenant } from "@/lib/domain/entities/tenant";
import { IUseCase } from "../use-case.interface";

export interface ListTenantsRequest {
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
}

export interface ListTenantsResponse {
  items: Tenant[];
  total: number;
  pageCount: number;
}

@injectable()
export class ListTenantsUseCase implements IUseCase<ListTenantsRequest, ListTenantsResponse> {
  constructor(@inject(TOKENS.TenantRepository) private tenantRepo: ITenantRepository) {}

  async execute(request: ListTenantsRequest): Promise<ListTenantsResponse> {
    const page = Math.max(1, request.page);
    const limit = Math.max(1, Math.min(request.limit, 100));
    const { items, total } = await this.tenantRepo.list({
      page,
      limit,
      search: request.search,
      active: request.active,
    });
    return {
      items,
      total,
      pageCount: Math.ceil(total / limit) || 1,
    };
  }
}
