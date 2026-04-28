import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { SaveBuylistItemUseCase } from "@/lib/application/use-cases/buylist/save-buylist-item.use-case";
import { getAdminContext } from "@/lib/tenant-server";
import type { IBuylistRepository } from "@/lib/domain/repositories/buylist.repository";
import type { ICardTemplateRepository } from "@/lib/domain/repositories/inventory.repository";
import { TOKENS } from "@/lib/infrastructure/container";

export async function POST(req: NextRequest) {
  try {
    const { tenant } = await getAdminContext();
    const body = await req.json();
    const { scryfallId, priceCash, priceCredit } = body;

    const cardTemplateRepo = container.resolve<ICardTemplateRepository>(TOKENS.CardTemplateRepository);
    const saveUseCase = container.resolve(SaveBuylistItemUseCase);

    // 1. Ensure CardTemplate exists
    const scryfallResp = await fetch(`https://api.scryfall.com/cards/${scryfallId}`);
    const cardData = await scryfallResp.json();

    if (!cardData || cardData.object === "error") {
      return NextResponse.json({ success: false, message: "Card não encontrado no Scryfall" }, { status: 404 });
    }

    const template = await cardTemplateRepo.save({
      id: "",
      name: cardData.name,
      set: cardData.set,
      imageUrl: cardData.image_uris?.normal || cardData.card_faces?.[0]?.image_uris?.normal || "",
      backImageUrl: cardData.card_faces?.[1]?.image_uris?.normal || null,
      game: "MAGIC",
      metadata: cardData as Record<string, unknown>,
    });

    const result = await saveUseCase.execute({
      id: "", // Will upsert
      tenantId: tenant.id,
      cardTemplateId: template.id,
      priceCash,
      priceCredit,
      active: true
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await getAdminContext();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "ID não fornecido" }, { status: 400 });
    }

    const repo = container.resolve<IBuylistRepository>(TOKENS.BuylistRepository);
    await repo.deleteItem(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
