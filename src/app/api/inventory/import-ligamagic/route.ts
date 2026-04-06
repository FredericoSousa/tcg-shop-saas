import { NextRequest, NextResponse } from "next/server";
import { getCollectionById } from "@/lib/liga-magic";
import { logger, createTimer } from "@/lib/logger";
import type { Condition } from "@prisma/client";

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

export async function POST(request: NextRequest) {
  const timer = createTimer("importLigaMagicCollection");

  try {
    const { collectionId } = await request.json();

    if (!collectionId || !collectionId.trim()) {
      return NextResponse.json(
        { error: "ID da coleção é obrigatório" },
        { status: 400 },
      );
    }

    logger.info("Starting LigaMagic collection import", {
      action: "import_ligamagic_collection",
      collectionId,
    });

    const cards = await getCollectionById(collectionId.trim());

    if (!cards.length) {
      return NextResponse.json(
        { error: "Nenhum card encontrado na coleção" },
        { status: 404 },
      );
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

    return NextResponse.json(results);
  } catch (error) {
    logger.error(
      "Error importing LigaMagic collection",
      error instanceof Error ? error : new Error(String(error)),
      {
        action: "import_ligamagic_collection",
      },
    );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao importar coleção" },
      { status: 500 },
    );
  } finally {
    timer.log({ action: "import_ligamagic_collection" });
  }
}
