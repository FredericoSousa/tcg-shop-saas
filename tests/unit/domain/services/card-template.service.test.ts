import { describe, it, expect, beforeEach, vi } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";
import { CardTemplateService } from "@/lib/domain/services/card-template.service";
import type { ICardTemplateRepository } from "@/lib/domain/repositories/inventory.repository";
import type { CardTemplate } from "@/lib/domain/entities/inventory";

const getCardsCollectionMock = vi.fn();

vi.mock("@/lib/scryfall", () => ({
  scryfall: {
    getCardsCollection: (...args: unknown[]) => getCardsCollectionMock(...args),
  },
}));

function template(overrides: Partial<CardTemplate>): CardTemplate {
  return {
    id: "id",
    name: "Card",
    set: "SET",
    imageUrl: null,
    backImageUrl: null,
    game: "MAGIC",
    metadata: null,
    ...overrides,
  };
}

describe("CardTemplateService.resolveTemplates", () => {
  let templateRepo: MockProxy<ICardTemplateRepository>;
  let service: CardTemplateService;

  beforeEach(() => {
    templateRepo = mock<ICardTemplateRepository>();
    service = new CardTemplateService(templateRepo);
    getCardsCollectionMock.mockReset();
  });

  it("returns an empty array when no IDs are passed", async () => {
    const result = await service.resolveTemplates([]);
    expect(result).toEqual([]);
    expect(templateRepo.findByIds).not.toHaveBeenCalled();
    expect(getCardsCollectionMock).not.toHaveBeenCalled();
  });

  it("returns DB templates and skips Scryfall when all already have an imageUrl", async () => {
    templateRepo.findByIds.mockResolvedValue([
      template({ id: "a", imageUrl: "http://img/a.png" }),
      template({ id: "b", imageUrl: "http://img/b.png" }),
    ]);

    const result = await service.resolveTemplates(["a", "b", "a"]);

    expect(getCardsCollectionMock).not.toHaveBeenCalled();
    expect(result.map(t => t.id).sort()).toEqual(["a", "b"]);
  });

  it("fetches missing IDs from Scryfall and upserts them with normalised set codes", async () => {
    templateRepo.findByIds.mockResolvedValue([
      template({ id: "kept", imageUrl: "http://img/kept.png" }),
    ]);
    getCardsCollectionMock.mockResolvedValue([
      {
        id: "fresh",
        name: "Fresh Card",
        set: "neo",
        image_uris: { normal: "http://img/fresh.png" },
      },
    ]);

    const result = await service.resolveTemplates(["kept", "fresh"]);

    expect(getCardsCollectionMock).toHaveBeenCalledWith([{ id: "fresh" }]);
    expect(templateRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "fresh", set: "NEO", imageUrl: "http://img/fresh.png" }),
    );
    expect(result.map(t => t.id).sort()).toEqual(["fresh", "kept"]);
  });

  it("re-fetches templates that exist but lack an imageUrl", async () => {
    templateRepo.findByIds.mockResolvedValue([
      template({ id: "stale", imageUrl: null }),
    ]);
    getCardsCollectionMock.mockResolvedValue([
      {
        id: "stale",
        name: "Stale",
        set: "lea",
        image_uris: { large: "http://img/stale-large.png" },
      },
    ]);

    const result = await service.resolveTemplates(["stale"]);

    expect(getCardsCollectionMock).toHaveBeenCalled();
    expect(result[0]?.imageUrl).toBe("http://img/stale-large.png");
  });

  it("falls back to face image_uris when the top-level uris are missing", async () => {
    templateRepo.findByIds.mockResolvedValue([]);
    getCardsCollectionMock.mockResolvedValue([
      {
        id: "double",
        name: "Double Faced",
        set: "mom",
        card_faces: [
          { image_uris: { normal: "http://img/front.png" } },
          { image_uris: { normal: "http://img/back.png" } },
        ],
      },
    ]);

    const result = await service.resolveTemplates(["double"]);

    expect(result[0]?.imageUrl).toBe("http://img/front.png");
    expect(result[0]?.backImageUrl).toBe("http://img/back.png");
  });
});
