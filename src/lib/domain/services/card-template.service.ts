import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/tokens";
import type { ICardTemplateRepository } from "@/lib/domain/repositories/inventory.repository";
import { scryfall } from "@/lib/scryfall";
import type { ScryfallCard } from "@/lib/types/scryfall";
import { CardTemplate } from "../entities/inventory";
import { Game } from "@prisma/client";

@injectable()
export class CardTemplateService {
  constructor(
    @inject(TOKENS.CardTemplateRepository)
    private templateRepo: ICardTemplateRepository
  ) {}

  private extractImageUrl(card: ScryfallCard): string | null {
    const uris = card.image_uris;
    return (
      uris?.normal ||
      uris?.large ||
      uris?.png ||
      uris?.border_crop ||
      uris?.art_crop ||
      uris?.small ||
      card.card_faces?.[0]?.image_uris?.normal ||
      card.card_faces?.[0]?.image_uris?.large ||
      card.card_faces?.[0]?.image_uris?.png ||
      null
    );
  }

  private extractBackImageUrl(card: ScryfallCard): string | null {
    return (
      card.card_faces?.[1]?.image_uris?.normal ||
      card.card_faces?.[1]?.image_uris?.large ||
      null
    );
  }

  async resolveTemplates(scryfallIds: string[]): Promise<CardTemplate[]> {
    const uniqueIds = Array.from(new Set(scryfallIds));
    if (uniqueIds.length === 0) return [];

    // 1. Find which IDs are already in DB with a valid imageUrl
    const existingTemplates = await this.templateRepo.findByIds(uniqueIds);
    const existingWithImage = new Map(
      existingTemplates.filter((t) => t.imageUrl).map((t) => [t.id, t]),
    );

    // Only fetch from Scryfall IDs that are new or lack an imageUrl
    const idsToFetch = uniqueIds.filter((id) => !existingWithImage.has(id));
    if (idsToFetch.length === 0) return existingTemplates;

    // 2. Fetch from Scryfall
    const scryfallCards = (await scryfall.getCardsCollection(
      idsToFetch.map((id) => ({ id })),
    )) as ScryfallCard[];

    const fetchedTemplates: CardTemplate[] = scryfallCards.map((card) => ({
      id: card.id,
      name: card.name,
      set: card.set.toUpperCase(),
      imageUrl: this.extractImageUrl(card),
      backImageUrl: this.extractBackImageUrl(card),
      game: Game.MAGIC,
      metadata: card as unknown as Record<string, unknown>,
    }));

    // 3. Upsert all fetched templates — guarantees imageUrl is written even if
    //    the record already exists with a null imageUrl (skipDuplicates would skip it)
    await Promise.all(fetchedTemplates.map((t) => this.templateRepo.save(t)));

    const fetchedMap = new Map(fetchedTemplates.map((t) => [t.id, t]));
    return uniqueIds.map(
      (id) => existingWithImage.get(id) ?? fetchedMap.get(id)!,
    ).filter(Boolean);
  }
}
