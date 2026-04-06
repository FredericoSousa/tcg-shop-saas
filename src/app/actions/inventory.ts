"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { scryfall } from "@/lib/scryfall";
import { revalidatePath } from "next/cache";
import { Condition, Game, Prisma } from "@prisma/client";
import { getCollectionById } from "@/lib/ligaMagic";
import { logger, createTimer } from "@/lib/logger";
import { cardCache, generateCardCacheKey } from "@/lib/cache/cardCache";

export async function addInventoryItem(formData: FormData) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    throw new Error("Unauthorized: Tenant ID missing");
  }

  const scryfallId = formData.get("scryfallId") as string;
  const price = parseFloat(formData.get("price") as string);
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const condition = formData.get("condition") as Condition;
  const language = formData.get("language") as string;
  const extras = formData.getAll("extras") as string[];

  if (
    !scryfallId ||
    isNaN(price) ||
    isNaN(quantity) ||
    !condition ||
    !language
  ) {
    throw new Error("Invalid form data");
  }

  let cardTemplate = await prisma.cardTemplate.findUnique({
    where: { id: scryfallId },
  });

  if (!cardTemplate) {
    const scryfallData = await scryfall.getCardById(scryfallId);
    if (!scryfallData) {
      throw new Error("Card not found in Scryfall");
    }

    const scryfallObj = scryfallData as Record<string, unknown>;
    const imageUris = scryfallObj.image_uris as
      | Record<string, string>
      | undefined;

    cardTemplate = await prisma.cardTemplate.create({
      data: {
        id: scryfallId, // Using Scryfall ID as our global template ID
        name: scryfallData.name,
        set: scryfallData.set.toUpperCase(),
        imageUrl:
          imageUris?.normal ||
          imageUris?.large ||
          imageUris?.png ||
          (scryfallData as any).card_faces?.[0]?.image_uris?.normal ||
          null,
        backImageUrl:
          (scryfallData as any).card_faces?.[1]?.image_uris?.normal || null,
        game: Game.MAGIC,
        metadata: scryfallData as unknown as Prisma.InputJsonObject,
      },
    });
  }

  const existing = await prisma.inventoryItem.findFirst({
    where: {
      tenantId,
      cardTemplateId: cardTemplate.id,
      price,
      condition,
      language,
      extras: { equals: extras },
    },
  });

  if (existing) {
    await prisma.inventoryItem.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + quantity,
        active: true,
      },
    });
  } else {
    await prisma.inventoryItem.create({
      data: {
        tenantId,
        cardTemplateId: cardTemplate.id,
        price,
        quantity,
        condition,
        language,
        extras,
      },
    });
  }

  revalidatePath("/admin/inventory");
}

export async function deleteInventoryItems(ids: string[]) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    throw new Error("Unauthorized: Tenant ID missing");
  }

  if (!ids.length) {
    throw new Error("No items selected");
  }

  await prisma.inventoryItem.updateMany({
    where: {
      id: { in: ids },
      tenantId, // Ensure tenant isolation
    },
    data: { active: false },
  });

  revalidatePath("/admin/inventory");
}

export type BulkItem = {
  cardName: string;
  quantity: number;
  condition: Condition;
  language: string;
  price: number;
};

export type BulkItemResult = {
  cardName: string;
  quantity: number;
  condition: string;
  language: string;
  price: number;
  status: "success" | "error";
  error?: string;
  scryfallId?: string;
  imageUrl?: string;
  setName?: string;
  setCode?: string;
  cardNumber?: string;
  extras?: string[];
};

export async function searchCardByName(
  name: string,
  setCode?: string,
  cardNumber?: string,
): Promise<BulkItemResult | null> {
  try {
    let query = `!"${name}"`;
    if (setCode) {
      query += ` set:${setCode.toLowerCase()}`;
    }
    if (cardNumber && setCode !== "PLST") {
      query += ` number:${cardNumber}`;
    }
    const cards = await scryfall.searchCards(query);
    if (!cards.length) return null;

    const card = cards[0];
    const cardObj = card as Record<string, unknown>;
    const imageUris = cardObj.image_uris as Record<string, string> | undefined;

    return {
      cardName: card.name,
      quantity: 1,
      condition: "NM",
      language: "EN",
      price: 0,
      status: "success",
      scryfallId: card.id,
      imageUrl:
        imageUris?.small ||
        imageUris?.normal ||
        (card as any).card_faces?.[0]?.image_uris?.small ||
        "",
      setName: card.set_name,
      setCode: card.set.toUpperCase(),
      cardNumber: (cardObj.collector_number as string) ?? "",
    };
  } catch {
    return null;
  }
}

export async function resolveCardsBatch(
  items: {
    cardName: string;
    setCode?: string;
    cardNumber?: string;
    quantity: number;
    condition: string;
    language: string;
    price: number;
    originalLine?: string;
    extras?: string[];
  }[],
): Promise<(BulkItemResult & { originalLine: string })[]> {
  const timer = createTimer("resolveCardsBatch");

  try {
    // Build identifiers for Scryfall batch lookup
    const identifiers = items.map((item) => {
      if (item.setCode && item.cardNumber && item.setCode !== "PLST") {
        return {
          set: item.setCode.toLowerCase(),
          collector_number: item.cardNumber,
        };
      }
      const id: any = { name: item.cardName };
      if (item.setCode) id.set = item.setCode.toLowerCase();
      return id;
    });

    // Fetch cards from Scryfall
    const cards = await scryfall.getCardsCollection(identifiers);

    // Cache all results for future lookups
    const cardsMap = new Map<string, any>();
    cards.forEach((card) => {
      const cacheKey = generateCardCacheKey({
        name: card.name,
        set: card.set,
        collector_number: (card as any).collector_number,
      });
      cardCache.set(cacheKey, card);

      // Also store with multiple keys for flexible matching
      const cardObj = card as any;
      const cName = card.name.toLowerCase();
      const cSet = card.set.toLowerCase();
      const cNum = cardObj.collector_number || "";

      const key1 = `${cName}|${cSet}|${cNum}`;
      const key2 = `${cName}|${cSet}|`;
      const key3 = `${cName}`;
      const key4 = `|${cSet}|${cNum}`;

      if (!cardsMap.has(key1)) cardsMap.set(key1, card);
      if (!cardsMap.has(key2)) cardsMap.set(key2, card);
      if (!cardsMap.has(key3)) cardsMap.set(key3, card);
      if (cSet && cNum && !cardsMap.has(key4)) cardsMap.set(key4, card);
    });

    return items.map((item) => {
      const iName = item.cardName.toLowerCase();
      const iSet = (item.setCode || "").toLowerCase();
      const iNum = item.cardNumber ?? "";

      const key1 = `${iName}|${iSet}|${iNum}`;
      const key2 = `${iName}|${iSet}|`;
      const key3 = `${iName}`;
      const key4 = `|${iSet}|${iNum}`;

      const card =
        cardsMap.get(key1) ||
        (iSet && iNum ? cardsMap.get(key4) : undefined) ||
        cardsMap.get(key2) ||
        cardsMap.get(key3);

      if (card) {
        const cardObj = card as any;
        const imageUris = cardObj.image_uris as
          | Record<string, string>
          | undefined;
        return {
          ...item,
          status: "success",
          scryfallId: card.id,
          imageUrl:
            imageUris?.small ||
            imageUris?.normal ||
            cardObj.card_faces?.[0]?.image_uris?.small ||
            "",
          setName: card.set_name,
          setCode: card.set.toUpperCase(),
          cardNumber: (cardObj.collector_number as string) ?? "",
          extras: item.extras || [],
          originalLine: item.originalLine || "",
        };
      } else {
        return {
          ...item,
          status: "error",
          error: "Card não encontrado no Scryfall",
          extras: item.extras || [],
          originalLine: item.originalLine || "",
        };
      }
    });
  } catch (error) {
    logger.warn("Batch card resolution failed", {
      action: "resolve_cards_batch",
      itemsCount: items.length,
      error: error instanceof Error ? error.message : String(error),
    });
    return items.map((i) => ({
      ...i,
      status: "error",
      error: "Erro na busca em lote",
      originalLine: i.originalLine || "",
    }));
  } finally {
    timer.log({ action: "resolve_cards_batch", itemsCount: items.length });
  }
}

export async function addBulkInventoryItems(
  items: {
    scryfallId: string;
    quantity: number;
    condition: Condition;
    language: string;
    price: number;
    extras?: string[];
  }[],
) {
  const timer = createTimer("addBulkInventoryItems");
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    throw new Error("Unauthorized: Tenant ID missing");
  }

  if (!items.length) {
    throw new Error("No items to add");
  }

  const results: {
    cardName: string;
    status: "success" | "error";
    error?: string;
  }[] = [];

  try {
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
    const fetchedScryfallData = new Map<string, any>();
    const stillMissing: string[] = [];

    for (const id of missingScryfallIds) {
      const cacheKey = generateCardCacheKey(id);
      const cachedData = cardCache.get(cacheKey);
      if (cachedData) {
        fetchedScryfallData.set(id, cachedData);
      } else {
        stillMissing.push(id);
      }
    }

    // Fetch from Scryfall only what's not in cache
    for (const id of stillMissing) {
      const data = await scryfall.getCardById(id);
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

          const scryfallObj = scryfallData as Record<string, unknown>;
          const imageUris = scryfallObj.image_uris as
            | Record<string, string>
            | undefined;

          const newTemplate = await tx.cardTemplate.create({
            data: {
              id: id,
              name: scryfallData.name,
              set: scryfallData.set.toUpperCase(),
              imageUrl:
                imageUris?.normal ||
                imageUris?.large ||
                imageUris?.png ||
                (scryfallData as any).card_faces?.[0]?.image_uris?.normal ||
                null,
              backImageUrl:
                (scryfallData as any).card_faces?.[1]?.image_uris?.normal ||
                null,
              game: Game.MAGIC,
              metadata: scryfallData as unknown as Prisma.InputJsonObject,
            },
          });
          nameMap.set(id, newTemplate.name);
        }

        // 2. Create inventory items
        for (const item of items) {
          // Check if template exists (either existing or just created)
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
    return results;
  } catch (error) {
    logger.error(
      "Error adding bulk inventory items",
      error instanceof Error ? error : new Error(String(error)),
      {
        action: "add_bulk_inventory",
        itemsCount: items.length,
      },
    );
    throw error;
  } finally {
    timer.log({ action: "add_bulk_inventory", itemsCount: items.length });
  }
}

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

export async function importLigaMagicCollection(
  collectionId: string,
): Promise<(BulkItemResult & { originalLine: string })[]> {
  const timer = createTimer("importLigaMagicCollection");

  if (!collectionId.trim()) {
    throw new Error("ID da coleção é obrigatório");
  }

  try {
    logger.info("Starting LigaMagic collection import", {
      action: "import_ligamagic_collection",
      collectionId,
    });

    const cards = await getCollectionById(collectionId.trim());

    if (!cards.length) {
      throw new Error("Nenhum card encontrado na coleção");
    }

    return cards.map((card) => {
      const condition = LM_CONDITION_MAP[card.condition ?? ""] || "NM";
      const language =
        LM_LANGUAGE_MAP[card.language?.toLowerCase() ?? ""] || "EN";

      return {
        cardName: (card as any).name ?? "Unknown",
        quantity: card.quantity || 1,
        condition,
        language,
        price: card.price || 0,
        status: "success" as const,
        setCode: card.set?.toUpperCase(),
        cardNumber: card.cardNumber || undefined,
        extras: card.extras || [],
        originalLine: `${card.quantity} ${(card as any).name} [${card.set?.toUpperCase() ?? "?"}] #${card.cardNumber}`,
      };
    });
  } catch (error) {
    logger.error(
      "Error importing LigaMagic collection",
      error instanceof Error ? error : new Error(String(error)),
      {
        action: "import_ligamagic_collection",
        collectionId,
      },
    );
    throw error;
  } finally {
    timer.log({ action: "import_ligamagic_collection", collectionId });
  }
}
