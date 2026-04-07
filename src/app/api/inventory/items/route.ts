import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { scryfall } from "@/lib/scryfall";
import { revalidatePath } from "next/cache";
import { Game, Prisma } from "@prisma/client";
import { ScryfallCard } from "@/lib/types/scryfall";
import { validateAdminApi } from "@/lib/tenant-server";

export async function POST(request: NextRequest) {
  const context = await validateAdminApi();

  if (!context) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { tenant } = context;

  try {
    const body = await request.json();
    const { scryfallId, price, quantity, condition, language, extras = [] } = body;

    if (
      !scryfallId ||
      isNaN(price) ||
      isNaN(quantity) ||
      !condition ||
      !language
    ) {
      return Response.json(
        { error: "Invalid data" },
        { status: 400 },
      );
    }

    let cardTemplate = await prisma.cardTemplate.findUnique({
      where: { id: scryfallId },
    });

    if (!cardTemplate) {
      const scryfallData = await scryfall.getCardById(scryfallId);
      if (!scryfallData) {
        return Response.json(
          { error: "Card not found in Scryfall" },
          { status: 404 },
        );
      }

      const scryfallObj = scryfallData as ScryfallCard;
      const imageUris = scryfallObj.image_uris;

      cardTemplate = await prisma.cardTemplate.create({
        data: {
          id: scryfallId,
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
    }

    const existing = await prisma.inventoryItem.findFirst({
      where: {
        tenantId: tenant.id,
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
          tenantId: tenant.id,
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
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error adding inventory item:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const context = await validateAdminApi();

  if (!context) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { tenant } = context;

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || !ids.length) {
      return Response.json(
        { error: "No items selected" },
        { status: 400 },
      );
    }

    await prisma.inventoryItem.updateMany({
      where: {
        id: { in: ids },
        tenantId: tenant.id, // Ensure tenant isolation
      },
      data: { active: false },
    });

    revalidatePath("/admin/inventory");
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory items:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const context = await validateAdminApi();

  if (!context) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { tenant } = context;

  try {
    const { id, price, quantity } = await request.json();

    if (!id || (price === undefined && quantity === undefined)) {
      return Response.json(
        { error: "Invalid data" },
        { status: 400 },
      );
    }

    const data: Prisma.InventoryItemUpdateInput = {};
    if (price !== undefined) data.price = new Prisma.Decimal(price);
    if (quantity !== undefined) data.quantity = parseInt(quantity, 10);

    await prisma.inventoryItem.update({
      where: {
        id,
        tenantId: tenant.id, // Ensure tenant isolation
      },
      data,
    });

    revalidatePath("/admin/inventory");
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
