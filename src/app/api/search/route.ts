import "reflect-metadata";
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/tokens";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import { getTenant } from "@/lib/tenant-server";
import { NextRequest, NextResponse } from "next/server";

const LIVE_SEARCH_LIMIT = 5;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const tenant = await getTenant();

  if (!tenant || q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  try {
    const inventory = container.resolve<IInventoryRepository>(TOKENS.InventoryRepository);
    const items = await inventory.searchStorefront(tenant.id, q, LIVE_SEARCH_LIMIT);

    return NextResponse.json({
      items: items.map(item => ({
        id: item.id,
        name: item.cardTemplate?.name,
        price: item.price,
        imageUrl: item.cardTemplate?.imageUrl,
        set: item.cardTemplate?.set,
      })),
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
