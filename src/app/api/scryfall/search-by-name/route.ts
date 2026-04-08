import { NextRequest } from "next/server";
import { scryfall } from "@/lib/scryfall";
import type { BulkItemResult } from "@/lib/types/inventory";
import { ScryfallCard } from "@/lib/types/scryfall";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

/**
 * @openapi
 * /api/scryfall/search-by-name:
 *   post:
 *     summary: Search Scryfall card by name
 *     description: Performs a precise search for a card by name and optional set/number. Returns standardized bulk item format.
 *     tags: [Scryfall]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               setCode: { type: string }
 *               cardNumber: { type: string }
 *     responses:
 *       200:
 *         description: Search result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export async function POST(request: NextRequest) {
  try {
    const { name, setCode, cardNumber } = await request.json();

    if (!name) {
      return ApiResponse.badRequest("Card name is required");
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
      return ApiResponse.success(null);
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

    return ApiResponse.success(result);
  } catch (error) {
    console.error("Search by name error:", error);
    return ApiResponse.success(null);
  }
}
