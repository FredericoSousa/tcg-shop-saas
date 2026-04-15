import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaCardTemplateRepository } from "@/lib/infrastructure/repositories/prisma-card-template.repository";

// Mock the prisma dependency
vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma as prismaMock } from "@/lib/prisma";

describe("PrismaCardTemplateRepository", () => {
  let repository: PrismaCardTemplateRepository;

  beforeEach(() => {
    mockReset(prismaMock);
    repository = new PrismaCardTemplateRepository();
  });

  it("should find a template by id", async () => {
    (prismaMock.cardTemplate.findUnique as any).mockResolvedValue({ id: "tmpl_1", name: "Card 1", set: "SET", game: "MAGIC" });
    const result = await repository.findById("tmpl_1");
    expect(result?.name).toBe("Card 1");
  });

  it("should return null if template not found by id", async () => {
    (prismaMock.cardTemplate.findUnique as any).mockResolvedValue(null);
    const result = await repository.findById("non_existent");
    expect(result).toBeNull();
  });

  it("should find multiple templates by their ids", async () => {
    const mockTemplates = [
      { id: "tmpl_1", name: "Card 1", set: "SET", game: "MAGIC" },
      { id: "tmpl_2", name: "Card 2", set: "SET", game: "MAGIC" }
    ];

    (prismaMock.cardTemplate.findMany as any).mockResolvedValue(mockTemplates);

    const results = await repository.findByIds(["tmpl_1", "tmpl_2"]);

    expect(prismaMock.cardTemplate.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["tmpl_1", "tmpl_2"] } }
    });
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("Card 1");
  });

  it("should create a new template when id is missing", async () => {
    const templateData = {
      id: "",
      name: "New Card",
      set: "NEW",
      game: "MAGIC",
      metadata: {}
    };

    (prismaMock.cardTemplate.create as any).mockResolvedValue({
      ...templateData,
      id: "generated_id",
      game: "MAGIC"
    });

    const result = await repository.save(templateData as any);

    expect(prismaMock.cardTemplate.create).toHaveBeenCalled();
    expect(result.id).toBe("generated_id");
  });

  it("should upsert a template when id is provided", async () => {
    const templateData = {
      id: "existing_id",
      name: "Updated Card",
      set: "SET",
      game: "MAGIC",
      metadata: {}
    };

    (prismaMock.cardTemplate.upsert as any).mockResolvedValue({
      ...templateData,
      game: "MAGIC"
    });

    await repository.save(templateData as any);

    expect(prismaMock.cardTemplate.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "existing_id" }
    }));
  });

  it("should create many templates in bulk with skipDuplicates and handle default values", async () => {
    const templates = [
      { id: "tmpl_1", name: "Card 1", set: "SET", game: "MAGIC" as any },
      {} // Empty to test defaults
    ];

    await repository.createMany(templates as any);

    expect(prismaMock.cardTemplate.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ id: "tmpl_1", name: "Card 1" }),
        expect.objectContaining({ name: "Unknown", set: "Unknown", game: "MAGIC" })
      ],
      skipDuplicates: true
    });
  });
});
