import { NextRequest } from "next/server";
import { scryfall } from "@/lib/scryfall";
import { logger, createTimer } from "@/lib/logger";
import { cardCache, generateCardCacheKey } from "@/lib/cache/card-cache";
import type { BulkItemResult } from "@/lib/types/inventory";
import { ScryfallCard } from "@/lib/types/scryfall";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

/**
 * @openapi
 * /api/scryfall/resolve-batch:
 *   post:
 *     summary: Resolve a batch of card identifiers
 *     description: Takes an array of card identifiers (name, set, number) and resolves them using Scryfall API.
 *     tags: [External]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required: [cardName, quantity, condition, language, price]
 *               properties:
 *                 cardName: { type: string }
 *                 setCode: { type: string }
 *                 cardNumber: { type: string }
 *                 quantity: { type: number }
 *                 condition: { type: string }
 *                 language: { type: string }
 *                 price: { type: number }
 *     responses:
 *       200:
 *         description: Array of resolved card results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export async function POST(request: NextRequest) {
  const timer = createTimer("resolveCardsBatch");

  try {
    const items: {
      cardName: string;
      setCode?: string;
      cardNumber?: string;
      quantity: number;
      condition: string;
      language: string;
      price: number;
      originalLine?: string;
      extras?: string[];
    }[] = await request.json();

    if (!Array.isArray(items) || !items.length) {
      return ApiResponse.badRequest("Array of items is required");
    }

    // Build identifiers for Scryfall batch lookup
    const identifiers = items.map((item) => {
      if (item.setCode && item.cardNumber && item.setCode !== "PLST") {
        return {
          set: item.setCode.toLowerCase(),
          collector_number: item.cardNumber,
        };
      }
      const id: { name: string; set?: string; collector_number?: string } = { name: item.cardName };
      if (item.setCode) id.set = item.setCode.toLowerCase();
      return id;
    });

    // Fetch cards from Scryfall
    const rawCards = await scryfall.getCardsCollection(identifiers);
    const cards = rawCards as ScryfallCard[];

    // Cache all results for future lookups
    const cardsMap = new Map<string, ScryfallCard>();
    cards.forEach((card) => {
      const cacheKey = generateCardCacheKey({
        name: card.name,
        set: card.set,
        collector_number: card.collector_number,
      });
      cardCache.set(cacheKey, card);

      const cName = card.name.toLowerCase();
      const cSet = card.set.toLowerCase();
      const cNum = card.collector_number || "";

      const key1 = `${cName}|${cSet}|${cNum}`;
      const key2 = `${cName}|${cSet}|`;
      const key3 = `${cName}`;
      const key4 = `|${cSet}|${cNum}`;

      if (!cardsMap.has(key1)) cardsMap.set(key1, card);
      if (!cardsMap.has(key2)) cardsMap.set(key2, card);
      if (!cardsMap.has(key3)) cardsMap.set(key3, card);
      if (cSet && cNum && !cardsMap.has(key4)) cardsMap.set(key4, card);
    });

    const results: (BulkItemResult & { originalLine: string })[] = items.map(
      (item) => {
        const iName = item.cardName.toLowerCase();
        const iSet = (item.setCode || "").toLowerCase();
        const iNum = item.cardNumber ?? "";

        const key1 = `${iName}|${iSet}|${iNum}`;
        const key2 = `${iName}|${iSet}|`;
        const key3 = `${iName}`;
        const key4 = `|${iSet}|${iNum}`;

        const card =
          cardsMap.get(key1) ||
          (iSet && iNum ? cardsMap.get(key4) : undefined) ||
          cardsMap.get(key2) ||
          cardsMap.get(key3);

        if (card) {
          return {
            ...item,
            status: "success" as const,
            scryfallId: card.id,
            imageUrl:
              card.image_uris?.small ||
              card.image_uris?.normal ||
              card.card_faces?.[0]?.image_uris?.small ||
              "",
            setName: card.set_name,
            setCode: card.set.toUpperCase(),
            cardNumber: card.collector_number || "",
            extras: item.extras || [],
            originalLine: item.originalLine || "",
          };
        } else {
          return {
            ...item,
            status: "error" as const,
            error: "Card não encontrado no Scryfall",
            extras: item.extras || [],
            originalLine: item.originalLine || "",
          };
        }
      },
    );

    return ApiResponse.success(results);
  } catch (error) {
    logger.warn("Batch card resolution failed", {
      action: "resolve_cards_batch",
      error: error instanceof Error ? error.message : String(error),
    });
    return ApiResponse.serverError("Erro na busca em lote");
  } finally {
    timer.log({ action: "resolve_cards_batch" });
  }
}
