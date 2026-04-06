import { NextRequest, NextResponse } from "next/server";
import { scryfall } from "@/lib/scryfall";
import { logger, createTimer } from "@/lib/logger";
import { cardCache, generateCardCacheKey } from "@/lib/cache/cardCache";
import type { BulkItemResult } from "@/lib/types/inventory";

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
      return NextResponse.json(
        { error: "Array of items is required" },
        { status: 400 },
      );
    }

    // Build identifiers for Scryfall batch lookup
    const identifiers = items.map((item) => {
      if (item.setCode && item.cardNumber && item.setCode !== "PLST") {
        return {
          set: item.setCode.toLowerCase(),
          collector_number: item.cardNumber,
        };
      }
      const id: any = { name: item.cardName };
      if (item.setCode) id.set = item.setCode.toLowerCase();
      return id;
    });

    // Fetch cards from Scryfall
    const cards = await scryfall.getCardsCollection(identifiers);

    // Cache all results for future lookups
    const cardsMap = new Map<string, any>();
    cards.forEach((card) => {
      const cacheKey = generateCardCacheKey({
        name: card.name,
        set: card.set,
        collector_number: (card as any).collector_number,
      });
      cardCache.set(cacheKey, card);

      // Also store with multiple keys for flexible matching
      const cardObj = card as any;
      const cName = card.name.toLowerCase();
      const cSet = card.set.toLowerCase();
      const cNum = cardObj.collector_number || "";

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
          const cardObj = card as any;
          const imageUris = cardObj.image_uris as
            | Record<string, string>
            | undefined;
          return {
            ...item,
            status: "success" as const,
            scryfallId: card.id,
            imageUrl:
              imageUris?.small ||
              imageUris?.normal ||
              cardObj.card_faces?.[0]?.image_uris?.small ||
              "",
            setName: card.set_name,
            setCode: card.set.toUpperCase(),
            cardNumber: (cardObj.collector_number as string) ?? "",
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

    return NextResponse.json(results);
  } catch (error) {
    logger.warn("Batch card resolution failed", {
      action: "resolve_cards_batch",
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Erro na busca em lote" },
      { status: 500 },
    );
  } finally {
    timer.log({ action: "resolve_cards_batch" });
  }
}
