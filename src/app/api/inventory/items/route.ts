import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { scryfall } from "@/lib/scryfall";
import { revalidatePath } from "next/cache";
import { Game, Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return NextResponse.json(
      { error: "Unauthorized: Tenant ID missing" },
      { status: 401 },
    );
  }

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
      return NextResponse.json(
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
        return NextResponse.json(
          { error: "Card not found in Scryfall" },
          { status: 404 },
        );
      }

      const scryfallObj = scryfallData as Record<string, unknown>;
      const imageUris = scryfallObj.image_uris as
        | Record<string, string>
        | undefined;

      cardTemplate = await prisma.cardTemplate.create({
        data: {
          id: scryfallId,
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
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding inventory item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return NextResponse.json(
      { error: "Unauthorized: Tenant ID missing" },
      { status: 401 },
    );
  }

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json(
        { error: "No items selected" },
        { status: 400 },
      );
    }

    await prisma.inventoryItem.updateMany({
      where: {
        id: { in: ids },
        tenantId, // Ensure tenant isolation
      },
      data: { active: false },
    });

    revalidatePath("/admin/inventory");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
