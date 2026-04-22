import { apiClient } from "../client";
import { PaginatedResult } from "./customer.service";

export interface AdminUser {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string | Date;
}

export const UserService = {
  async list({ page, limit, search }: { page?: number; limit?: number; search?: string } = {}) {
    const query = new URLSearchParams();
    if (page) query.append("page", page.toString());
    if (limit) query.append("limit", limit.toString());
    if (search) query.append("search", search);
    return apiClient.get<PaginatedResult<AdminUser>>(`/api/admin/users?${query.toString()}`);
  },

  async create(data: unknown) {
    return apiClient.post<AdminUser>("/api/admin/users", data);
  },

  async delete(id: string) {
    return apiClient.delete<void>(`/api/admin/users/${id}`);
  },
};
