import { apiClient } from "../client";

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: string;
  imageUrl?: string;
  allowNegativeStock?: boolean;
}

export const ProductService = {
  async create(data: CreateProductDto) {
    return apiClient.post("/api/admin/products", data);
  },

  async update(id: string, data: Partial<CreateProductDto>) {
    return apiClient.put(`/api/admin/products/${id}`, data);
  },

  async delete(id: string) {
    return apiClient.delete(`/api/admin/products/${id}`);
  },
};
