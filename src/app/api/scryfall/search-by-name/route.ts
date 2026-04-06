import { NextRequest, NextResponse } from "next/server";
import { scryfall } from "@/lib/scryfall";
import type { BulkItemResult } from "@/lib/types/inventory";

export async function POST(request: NextRequest) {
  try {
    const { name, setCode, cardNumber } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Card name is required" },
        { status: 400 },
      );
    }

    let query = `!"${name}"`;
    if (setCode) {
      query += ` set:${setCode.toLowerCase()}`;
    }
    if (cardNumber && setCode !== "PLST") {
      query += ` number:${cardNumber}`;
    }

    const cards = await scryfall.searchCards(query);
    if (!cards.length) {
      return NextResponse.json(null);
    }

    const card = cards[0];
    const cardObj = card as Record<string, unknown>;
    const imageUris = cardObj.image_uris as Record<string, string> | undefined;

    const result: BulkItemResult = {
      cardName: card.name,
      quantity: 1,
      condition: "NM",
      language: "EN",
      price: 0,
      status: "success",
      scryfallId: card.id,
      imageUrl:
        imageUris?.small ||
        imageUris?.normal ||
        (card as any).card_faces?.[0]?.image_uris?.small ||
        "",
      setName: card.set_name,
      setCode: card.set.toUpperCase(),
      cardNumber: (cardObj.collector_number as string) ?? "",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Search by name error:", error);
    return NextResponse.json(null);
  }
}
