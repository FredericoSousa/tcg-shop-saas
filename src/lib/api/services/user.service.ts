import { apiClient } from "../client";
import { User } from "@/lib/domain/entities/tenant";
import { PaginatedResult } from "./customer.service";

export const UserService = {
  async list({ page, limit, search }: { page?: number; limit?: number; search?: string } = {}) {
    const query = new URLSearchParams();
    if (page) query.append("page", page.toString());
    if (limit) query.append("limit", limit.toString());
    if (search) query.append("search", search);
    return apiClient.get<PaginatedResult<User>>(`/api/admin/users?${query.toString()}`);
  },

  async create(data: unknown) {
    return apiClient.post<User>("/api/admin/users", data);
  },

  async delete(id: string) {
    return apiClient.delete<void>(`/api/admin/users/${id}`);
  },
};
