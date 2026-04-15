import { apiClient } from "../client";

export interface SaveBuylistItemDto {
  scryfallId: string;
  priceCash: number;
  priceCredit: number;
}

export const BuylistService = {
  async saveItem(data: SaveBuylistItemDto) {
    return apiClient.post("/api/admin/buylist/items", data);
  },

  async deleteItem(id: string) {
    return apiClient.delete(`/api/admin/buylist/items?id=${id}`);
  },

  async listItems() {
    return apiClient.get("/api/admin/buylist/items");
  }
};
