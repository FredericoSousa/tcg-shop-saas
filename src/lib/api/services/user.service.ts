import { apiClient } from "../client";

export const UserService = {
  async list({ page, limit, search }: { page?: number; limit?: number; search?: string } = {}) {
    const query = new URLSearchParams();
    if (page) query.append("page", page.toString());
    if (limit) query.append("limit", limit.toString());
    if (search) query.append("search", search);
    return apiClient.get<any>(`/api/admin/users?${query.toString()}`);
  },

  async create(data: any) {
    return apiClient.post("/api/admin/users", data);
  },

  async delete(id: string) {
    return apiClient.delete(`/api/admin/users/${id}`);
  },
};
