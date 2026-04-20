import { NextRequest } from "next/server";
import { scryfall } from "@/lib/scryfall";
import type { BulkItemResult } from "@/lib/types/inventory";
import { ScryfallCard } from "@/lib/types/scryfall";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import { withAdminApi } from "@/lib/tenant-server";
import { logger } from "@/lib/logger";

/**
 * @openapi
 * /api/scryfall/search-by-name:
 *   post:
 *     summary: Search Scryfall card by name
 *     description: Performs a precise search for a card by name and optional set/number. Requires admin authentication.
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
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  return withAdminApi(async () => {
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
      logger.warn("Search by name failed", {
        action: "scryfall_search_by_name",
        error: error instanceof Error ? error.message : String(error),
      });
      return ApiResponse.success(null);
    }
  });
}
