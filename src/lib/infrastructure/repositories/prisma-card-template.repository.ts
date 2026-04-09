import { injectable } from "tsyringe";
import { BasePrismaRepository } from "./base-prisma.repository";
import { Prisma } from "@prisma/client";
import type { ICardTemplateRepository } from "@/lib/domain/repositories/inventory.repository";
import { CardTemplate as DomainCardTemplate } from "@/lib/domain/entities/inventory";
import { CardTemplate as PrismaCardTemplate, Game as PrismaGame } from "@prisma/client";
import type { ScryfallCard } from "@/lib/types/scryfall";

@injectable()
export class PrismaCardTemplateRepository extends BasePrismaRepository implements ICardTemplateRepository {
  private mapToDomain(item: PrismaCardTemplate): DomainCardTemplate {
    return {
      id: item.id,
      name: item.name,
      set: item.set,
      imageUrl: item.imageUrl,
      backImageUrl: item.backImageUrl,
      game: item.game,
      metadata: item.metadata as Record<string, unknown> | null,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private mapScryfallToDomain(card: ScryfallCard): DomainCardTemplate {
    return {
      id: "",
      name: card.name,
      set: card.set,
      imageUrl: (card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal) ?? null,
      backImageUrl: card.card_faces?.[1]?.image_uris?.normal ?? null,
      game: "MAGIC",
      metadata: card as unknown as Record<string, unknown>,
    };
  }

  async findById(id: string): Promise<DomainCardTemplate | null> {
    const item = await this.prisma.cardTemplate.findUnique({
      where: { id },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async findByIds(ids: string[]): Promise<DomainCardTemplate[]> {
    const items = await this.prisma.cardTemplate.findMany({
      where: { id: { in: ids } },
    });
    return items.map(this.mapToDomain.bind(this));
  }

  async save(template: DomainCardTemplate): Promise<DomainCardTemplate> {
    const saved = await this.prisma.cardTemplate.upsert({
      where: { id: template.id },
      create: {
        id: template.id,
        name: template.name,
        set: template.set,
        imageUrl: template.imageUrl ?? null,
        backImageUrl: template.backImageUrl ?? null,
        game: template.game as PrismaGame,
        metadata: template.metadata as Prisma.InputJsonValue,
      },
      update: {
        name: template.name,
        set: template.set,
        imageUrl: template.imageUrl ?? null,
        backImageUrl: template.backImageUrl ?? null,
        game: template.game as PrismaGame,
        metadata: template.metadata as Prisma.InputJsonValue,
      },
    });

    return this.mapToDomain(saved);
  }

  async createMany(templates: DomainCardTemplate[]): Promise<void> {
    await this.prisma.cardTemplate.createMany({
      data: templates.map((t) => ({
        id: t.id,
        name: t.name,
        set: t.set,
        imageUrl: t.imageUrl ?? null,
        backImageUrl: t.backImageUrl ?? null,
        game: t.game as PrismaGame,
        metadata: t.metadata as Prisma.InputJsonValue,
      })),
      skipDuplicates: true,
    });
  }
}
