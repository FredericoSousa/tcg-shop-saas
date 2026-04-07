import { prisma } from "../../prisma";
import { ICardTemplateRepository } from "@/lib/domain/repositories/inventory.repository";
import { CardTemplate as DomainCardTemplate } from "@/lib/domain/entities/inventory";

export class PrismaCardTemplateRepository implements ICardTemplateRepository {
  private mapToDomain(item: any): DomainCardTemplate {
    return {
      id: item.id,
      name: item.name,
      set: item.set,
      imageUrl: item.imageUrl,
      backImageUrl: item.backImageUrl,
      game: item.game,
      metadata: item.metadata as Record<string, any> | null,
    };
  }

  async findById(id: string): Promise<DomainCardTemplate | null> {
    const item = await prisma.cardTemplate.findUnique({
      where: { id },
    });
    return item ? this.mapToDomain(item) : null;
  }

  async save(template: DomainCardTemplate): Promise<DomainCardTemplate> {
    const saved = await prisma.cardTemplate.upsert({
      where: { id: template.id },
      create: {
        id: template.id,
        name: template.name,
        set: template.set,
        imageUrl: template.imageUrl,
        backImageUrl: template.backImageUrl,
        game: template.game as any,
        metadata: template.metadata as any,
      },
      update: {
        name: template.name,
        set: template.set,
        imageUrl: template.imageUrl,
        backImageUrl: template.backImageUrl,
        game: template.game as any,
        metadata: template.metadata as any,
      },
    });

    return this.mapToDomain(saved);
  }
}
