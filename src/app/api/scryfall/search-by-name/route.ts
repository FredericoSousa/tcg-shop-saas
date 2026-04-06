import { NextRequest, NextResponse } from "next/server";
import { scryfall } from "@/lib/scryfall";
import type { BulkItemResult } from "@/lib/types/inventory";
import { ScryfallCard } from "@/lib/types/scryfall";

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

    const cards = (await scryfall.searchCards(query)) as ScryfallCard[];
    if (!cards.length) {
      return NextResponse.json(null);
    }

    const card = cards[0];
    const imageUris = card.image_uris;

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
        card.card_faces?.[0]?.image_uris?.small ||
        "",
      setName: card.set_name,
      setCode: card.set.toUpperCase(),
      cardNumber: card.collector_number || "",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Search by name error:", error);
    return NextResponse.json(null);
  }
}
