import { Tenant } from "../entities/tenant";

export interface ListTenantsOptions {
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
}

export interface ListTenantsResult {
  items: Tenant[];
  total: number;
}

export interface CreateTenantInput {
  slug: string;
  name: string;
  email?: string | null;
}

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  update(id: string, data: Partial<Tenant>): Promise<Tenant>;
  list(options: ListTenantsOptions): Promise<ListTenantsResult>;
  create(input: CreateTenantInput): Promise<Tenant>;
}
