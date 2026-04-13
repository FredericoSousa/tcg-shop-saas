import "reflect-metadata";
import { container } from "@/lib/infrastructure/container";
import { GetStorefrontInventoryUseCase } from "@/lib/application/use-cases/get-storefront-inventory.use-case";
import { getTenant } from "@/lib/tenant-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");
  
  const tenant = await getTenant();
  
  if (!tenant || !q || q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  try {
    const getInventory = container.resolve(GetStorefrontInventoryUseCase);
    const response = await getInventory.execute({
      tenantId: tenant.id,
      page: 1,
      filters: { search: q }
    });

    // Return only top 5 results for live search
    return NextResponse.json({ 
      items: response.items.slice(0, 5).map(item => ({
        id: item.id,
        name: item.cardTemplate?.name,
        price: item.price,
        imageUrl: item.cardTemplate?.imageUrl,
        set: item.cardTemplate?.set
      }))
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
