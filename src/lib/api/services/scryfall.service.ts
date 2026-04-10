import { ScryfallCard } from "@/lib/types/scryfall";
import { BulkItemResult } from "@/lib/types/inventory";
import { apiClient } from "../client";

export const ScryfallService = {
  async search(query: string) {
    return apiClient.get<ScryfallCard[]>(`/api/scryfall/search?q=${encodeURIComponent(query)}`);
  },

  async resolveBatch(items: Array<{
    cardName: string;
    setCode?: string;
    cardNumber?: string;
    quantity: number;
    condition: string;
    language: string;
    price: number;
    extras: string[];
    originalLine: string;
  }>) {
    return apiClient.post<(BulkItemResult & { originalLine: string })[]>("/api/scryfall/resolve-batch", items);
  },

  async searchByName(name: string, setCode?: string, cardNumber?: string) {
    return apiClient.post<BulkItemResult>("/api/scryfall/search-by-name", {
      name,
      setCode,
      cardNumber,
    });
  },
};
