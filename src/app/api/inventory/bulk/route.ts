import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { scryfall } from "@/lib/scryfall";
import { revalidatePath } from "next/cache";
import { Condition, Game, Prisma } from "@prisma/client";
import { logger, createTimer } from "@/lib/logger";
import { cardCache, generateCardCacheKey } from "@/lib/cache/card-cache";
import { ScryfallCard } from "@/lib/types/scryfall";

export async function POST(request: NextRequest) {
  const timer = createTimer("addBulkInventoryItems");
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return NextResponse.json(
      { error: "Unauthorized: Tenant ID missing" },
      { status: 401 },
    );
  }

  try {
    const items: {
      scryfallId: string;
      quantity: number;
      condition: Condition;
      language: string;
      price: number;
      extras?: string[];
    }[] = await request.json();

    if (!Array.isArray(items) || !items.length) {
      return NextResponse.json(
        { error: "No items to add" },
        { status: 400 },
      );
    }

    const results: {
      cardName: string;
      status: "success" | "error";
      error?: string;
    }[] = [];

    // Pre-fetch all missing card templates outside the transaction
    const uniqueScryfallIds = Array.from(
      new Set(items.map((i) => i.scryfallId)),
    );

    const existingTemplates = await prisma.cardTemplate.findMany({
      where: { id: { in: uniqueScryfallIds } },
      select: { id: true, name: true },
    });
    const existingIds = new Set(existingTemplates.map((t) => t.id));

    const missingScryfallIds = uniqueScryfallIds.filter(
      (id) => !existingIds.has(id),
    );

    // Check cache first for missing IDs
    const fetchedScryfallData = new Map<string, ScryfallCard>();
    const stillMissing: string[] = [];

    for (const id of missingScryfallIds) {
      const cacheKey = generateCardCacheKey(id);
      const cachedData = cardCache.get(cacheKey) as ScryfallCard | null;
      if (cachedData) {
        fetchedScryfallData.set(id, cachedData);
      } else {
        stillMissing.push(id);
      }
    }

    // Fetch from Scryfall only what's not in cache
    for (const id of stillMissing) {
      const data = (await scryfall.getCardById(id)) as ScryfallCard | null;
      if (data) {
        fetchedScryfallData.set(id, data);
        const cacheKey = generateCardCacheKey(id);
        cardCache.set(cacheKey, data);
      }
    }

    // Fast database transaction for mutations only
    await prisma.$transaction(
      async (tx) => {
        const nameMap = new Map<string, string>();
        for (const t of existingTemplates) {
          nameMap.set(t.id, t.name);
        }

        // 1. Create missing templates
        for (const id of missingScryfallIds) {
          const scryfallData = fetchedScryfallData.get(id);
          if (!scryfallData) continue;

          const scryfallObj = scryfallData;
          const imageUris = scryfallObj.image_uris;

          const newTemplate = await tx.cardTemplate.create({
            data: {
              id: id,
              name: scryfallData.name,
              set: scryfallData.set.toUpperCase(),
              imageUrl:
                imageUris?.normal ||
                imageUris?.large ||
                imageUris?.png ||
                scryfallObj.card_faces?.[0]?.image_uris?.normal ||
                null,
              backImageUrl:
                scryfallObj.card_faces?.[1]?.image_uris?.normal || null,
              game: Game.MAGIC,
              metadata: scryfallData as unknown as Prisma.InputJsonObject,
            },
          });
          nameMap.set(id, newTemplate.name);
        }

        // 2. Create inventory items
        for (const item of items) {
          if (!nameMap.has(item.scryfallId)) {
            results.push({
              cardName: item.scryfallId,
              status: "error",
              error: "Card not found in Scryfall",
            });
            continue;
          }

          const existing = await tx.inventoryItem.findFirst({
            where: {
              tenantId,
              cardTemplateId: item.scryfallId,
              price: item.price,
              condition: item.condition,
              language: item.language,
              extras: { equals: item.extras || [] },
            },
          });

          if (existing) {
            await tx.inventoryItem.update({
              where: { id: existing.id },
              data: {
                quantity: existing.quantity + item.quantity,
                active: true,
              },
            });
          } else {
            await tx.inventoryItem.create({
              data: {
                tenantId,
                cardTemplateId: item.scryfallId,
                price: item.price,
                quantity: item.quantity,
                condition: item.condition,
                language: item.language,
                extras: item.extras || [],
              },
            });
          }

          results.push({
            cardName: nameMap.get(item.scryfallId)!,
            status: "success",
          });
        }
      },
      { timeout: 20000 },
    );

    revalidatePath("/admin/inventory");
    logger.info("Bulk inventory items added successfully", {
      action: "add_bulk_inventory",
      itemsCount: items.length,
      successCount: results.filter((r) => r.status === "success").length,
    });
    return NextResponse.json(results);
  } catch (error) {
    logger.error(
      "Error adding bulk inventory items",
      error instanceof Error ? error : new Error(String(error)),
      {
        action: "add_bulk_inventory",
      },
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  } finally {
    timer.log({ action: "add_bulk_inventory" });
  }
}
