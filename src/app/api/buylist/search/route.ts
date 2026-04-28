import { NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { GetStorefrontBuylistUseCase } from "@/lib/application/use-cases/buylist/get-storefront-buylist.use-case";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const tenant = await getTenant();

  if (!tenant) {
    return NextResponse.json({ items: [] });
  }

  const useCase = container.resolve(GetStorefrontBuylistUseCase);
  const response = await useCase.execute({
    tenantId: tenant.id,
    page: 1,
    filters: { search: query }
  });

  const items = response.items.map(item => ({
    id: item.id,
    name: item.cardTemplate?.name || "",
    set: item.cardTemplate?.set || "",
    price: item.priceCredit, // Using credit price for buylist search preview
    imageUrl: item.cardTemplate?.imageUrl
  }));

  // Limit to top 8 for live search
  return NextResponse.json({ items: items.slice(0, 8) });
}
