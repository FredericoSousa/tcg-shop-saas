import { apiClient } from "../client";

export interface ListCustomersParams {
  page: number;
  limit: number;
  search?: string;
  includeDeleted?: boolean;
}

export interface CustomerDto {
  name: string;
  email?: string;
  phoneNumber: string;
}

export const CustomerService = {
  async list(params: ListCustomersParams) {
    const query = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });
    if (params.search) query.append("search", params.search);
    if (params.includeDeleted) query.append("includeDeleted", "true");

    return apiClient.get<any>(`/api/admin/customers?${query.toString()}`);
  },

  async create(data: CustomerDto) {
    return apiClient.post("/api/admin/customers", data);
  },

  async update(id: string, data: CustomerDto) {
    return apiClient.put(`/api/admin/customers/${id}`, data);
  },

  async delete(id: string) {
    return apiClient.delete(`/api/admin/customers/${id}`);
  },

  async restore(id: string) {
    return apiClient.patch(`/api/admin/customers/${id}`);
  },
};
