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

  async resolveTemplates(scryfallIds: string[]): Promise<CardTemplate[]> {
    const uniqueIds = Array.from(new Set(scryfallIds));
    if (uniqueIds.length === 0) return [];

    // 1. Fetch existing templates from DB
    const existingTemplates = await this.templateRepo.findByIds(uniqueIds);
    const existingTemplateIds = new Set(existingTemplates.map((t) => t.id));

    const missingIds = uniqueIds.filter((id) => !existingTemplateIds.has(id));
    if (missingIds.length === 0) return existingTemplates;

    // 2. Fetch missing templates from Scryfall
    const scryfallIdentifiers = missingIds.map((id) => ({ id }));
    const scryfallCards = (await scryfall.getCardsCollection(
      scryfallIdentifiers
    )) as ScryfallCard[];

    const newTemplates: CardTemplate[] = scryfallCards.map((card) => {
      const imageUris = card.image_uris;
      return {
        id: card.id,
        name: card.name,
        set: card.set.toUpperCase(),
        imageUrl:
          imageUris?.normal ||
          imageUris?.large ||
          imageUris?.png ||
          card.card_faces?.[0]?.image_uris?.normal ||
          null,
        backImageUrl: card.card_faces?.[1]?.image_uris?.normal || null,
        game: Game.MAGIC,
        metadata: card as unknown as Record<string, unknown>,
      };
    });

    // 3. Save new templates and return merged list
    if (newTemplates.length > 0) {
      await this.templateRepo.createMany(newTemplates);
    }

    return [...existingTemplates, ...newTemplates];
  }
}
