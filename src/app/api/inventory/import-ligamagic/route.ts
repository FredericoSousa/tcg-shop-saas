import { NextRequest } from "next/server";
import { getCollectionById } from "@/lib/liga-magic";
import { logger, createTimer } from "@/lib/logger";
import type { Condition } from "@prisma/client";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import { withAdminApi } from "@/lib/tenant-server";

const LM_CONDITION_MAP: Record<string, Condition> = {
  M: "NM",
  NM: "NM",
  SP: "SP",
  MP: "MP",
  HP: "HP",
  D: "D",
};

const LM_LANGUAGE_MAP: Record<string, string> = {
  en: "EN",
  pt: "PT",
  jp: "JP",
  ja: "JP",
};

/**
 * @openapi
 * /api/inventory/import-ligamagic:
 *   post:
 *     summary: Import LigaMagic collection
 *     description: Imports a collection of cards from LigaMagic by collection ID. Requires admin authentication.
 *     tags: [Inventory]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [collectionId]
 *             properties:
 *               collectionId: { type: string }
 *     responses:
 *       200:
 *         description: List of imported cards
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No cards found
 */
export async function POST(request: NextRequest) {
  return withAdminApi(async () => {
    const timer = createTimer("importLigaMagicCollection");

    try {
      const { collectionId } = await request.json();

      if (!collectionId || !collectionId.trim()) {
        return ApiResponse.badRequest("ID da coleção é obrigatório");
      }

      logger.info("Starting LigaMagic collection import", {
        action: "import_ligamagic_collection",
        collectionId,
      });

      const cards = await getCollectionById(collectionId.trim());

      if (!cards.length) {
        return ApiResponse.notFound("Nenhum card encontrado na coleção");
      }

      const results = cards.map((card) => {
        const condition = LM_CONDITION_MAP[card.condition ?? ""] || "NM";
        const language =
          LM_LANGUAGE_MAP[card.language?.toLowerCase() ?? ""] || "EN";

        return {
          cardName: card.name ?? "Unknown",
          quantity: card.quantity || 1,
          condition,
          language,
          price: card.price || 0,
          status: "success" as const,
          setCode: card.set?.toUpperCase(),
          cardNumber: card.cardNumber || undefined,
          extras: card.extras || [],
          originalLine: `${card.quantity} ${card.name ?? "Unknown"} [${card.set?.toUpperCase() ?? "?"}] #${card.cardNumber}`,
        };
      });

      return ApiResponse.success(results);
    } finally {
      timer.log({ action: "import_ligamagic_collection" });
    }
  });
}
