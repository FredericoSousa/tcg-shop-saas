import { injectable } from "tsyringe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveTenantId } from "../../../tenant-context";
import { IUseCase } from "../use-case.interface";

export type UserRole = "ADMIN" | "USER";

export interface ListUsersRequest {
  page: number;
  limit: number;
  search?: string;
}

export interface ListUsersResponse {
  items: {
    id: string;
    email: string;
    role: UserRole;
    createdAt: Date;
  }[];
  total: number;
  pageCount: number;
}

@injectable()
export class ListUsersUseCase implements IUseCase<ListUsersRequest, ListUsersResponse> {
  async execute(request: ListUsersRequest): Promise<ListUsersResponse> {
    const page = Math.max(1, request.page);
    const limit = Math.max(1, request.limit);
    const search = request.search?.trim().toLowerCase();
    const tenantId = await resolveTenantId();
    if (!tenantId) throw new Error("Tenant context missing");

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (error) throw new Error(error.message);

    const tenantUsers = data.users.filter(
      (u) => u.app_metadata?.tenantId === tenantId,
    );

    const filtered = search
      ? tenantUsers.filter((u) => u.email?.toLowerCase().includes(search))
      : tenantUsers;

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const paged = filtered.slice(skip, skip + limit);

    return {
      items: paged.map((u) => ({
        id: u.id,
        email: u.email!,
        role: (u.app_metadata?.role ?? "USER") as UserRole,
        createdAt: new Date(u.created_at),
      })),
      total,
      pageCount: Math.ceil(total / limit) || 1,
    };
  }
}
