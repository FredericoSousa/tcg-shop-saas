import { apiClient } from "../client";

export const CategoryService = {
  async create(name: string, showOnEcommerce: boolean) {
    return apiClient.post("/api/admin/categories", { name, showOnEcommerce });
  },

  async delete(id: string) {
    return apiClient.delete(`/api/admin/categories/${id}`);
  },
};
