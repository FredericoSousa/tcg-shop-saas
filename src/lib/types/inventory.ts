import type { Condition } from "@prisma/client";

export type BulkItem = {
  cardName: string;
  quantity: number;
  condition: Condition;
  language: string;
  price: number;
};

export type BulkItemResult = {
  cardName: string;
  quantity: number;
  condition: string;
  language: string;
  price: number;
  status: "success" | "error";
  error?: string;
  scryfallId?: string;
  imageUrl?: string;
  setName?: string;
  setCode?: string;
  cardNumber?: string;
  extras?: string[];
};
