import { apiClient } from "../client";

export interface CreateInventoryItemDto {
  scryfallId: string;
  price: number;
  quantity: number;
  condition: string;
  language: string;
  extras: string[];
  allowNegativeStock?: boolean;
}

export interface BulkInventoryItemDto {
  scryfallId: string;
  quantity: number;
  condition: "NM" | "SP" | "MP" | "HP" | "D";
  language: "EN" | "PT" | "JP";
  price: number;
  extras: string[];
  allowNegativeStock?: boolean;
}

export const InventoryService = {
  async addItem(data: CreateInventoryItemDto) {
    return apiClient.post("/api/inventory/items", data);
  },

  async bulkAdd(items: BulkInventoryItemDto[]) {
    return apiClient.post<{ cardName: string; status: "success" | "error"; error?: string }[]>("/api/inventory/bulk", items);
  },

  async importLigaMagic(collectionId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return apiClient.post<any[]>("/api/inventory/import-ligamagic", { collectionId });
  },

  async deleteItems(ids: string[]) {
    return apiClient.delete("/api/inventory/items", { ids });
  },

  async updateItems(ids: string[], price?: number, quantity?: number) {
    return apiClient.patch("/api/inventory/items", {
      ids,
      price,
      quantity,
    });
  },
};
