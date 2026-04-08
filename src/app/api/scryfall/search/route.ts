import { NextRequest } from "next/server";
import { scryfall } from "@/lib/scryfall";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

/**
 * @openapi
 * /api/scryfall/search:
 *   get:
 *     summary: Search cards on Scryfall
 *     description: Searches for magic cards using the Scryfall API.
 *     tags: [External]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         required: true
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Missing query parameter
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return ApiResponse.badRequest("Query parameter 'q' is required");
  }

  try {
    const cards = await scryfall.searchCards(query);
    return ApiResponse.success(cards);
  } catch (error) {
    console.error("Scryfall search error:", error);
    return ApiResponse.serverError("Error searching Scryfall");
  }
}
