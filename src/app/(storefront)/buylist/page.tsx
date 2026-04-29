import "reflect-metadata";
import { getTenant } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { GetStorefrontBuylistUseCase } from "@/lib/application/use-cases/buylist/get-storefront-buylist.use-case";
import { GetBuylistFiltersUseCase } from "@/lib/application/use-cases/buylist/get-buylist-filters.use-case";
import { BuylistClient } from "./buylist-client";
import { Sparkles } from "lucide-react";
import { cacheTag, cacheLife } from "next/cache";

type BuylistFilters = {
  color?: string;
  type?: string;
  set?: string;
  search?: string;
};

async function getCachedBuylist(
  tenantId: string,
  page: number,
  filters: BuylistFilters,
) {
  "use cache";
  cacheLife("hours");
  cacheTag(`tenant-${tenantId}-buylist`);
  const useCase = container.resolve(GetStorefrontBuylistUseCase);
  return useCase.execute({ tenantId, page, filters });
}

async function getCachedBuylistFilters(tenantId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`tenant-${tenantId}-buylist`);
  const useCase = container.resolve(GetBuylistFiltersUseCase);
  return useCase.execute({ tenantId });
}

export default async function BuylistPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const filters: BuylistFilters = {
    color: typeof searchParams?.color === "string" ? searchParams.color : undefined,
    type: typeof searchParams?.type === "string" ? searchParams.type : undefined,
    set: typeof searchParams?.set === "string" ? searchParams.set : undefined,
    search: typeof searchParams?.q === "string" ? searchParams.q : undefined,
  };

  const tenant = await getTenant();

  if (!tenant) {
    return (
      <div className="p-8 text-center pt-24 min-h-screen flex items-center justify-center bg-muted/20">
        <div className="bg-white p-12 rounded-2xl shadow-sm border max-w-md w-full space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <h1 className="text-2xl font-black mb-2">Loja não encontrada</h1>
        </div>
      </div>
    );
  }

  const [buylistResponse, buylistFilters] = await Promise.all([
    getCachedBuylist(tenant.id, page, filters),
    getCachedBuylistFilters(tenant.id),
  ]);

  const { items, total, pageCount } = buylistResponse;

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl font-black tracking-tight lg:text-4xl text-foreground">Buylist</h1>
          <p className="text-muted-foreground mt-2 text-lg">Vendemos as suas cartas. Veja o que estamos comprando hoje.</p>
        </header>

        <BuylistClient
          initialItems={items}
          availableFilters={buylistFilters}
          pageCount={pageCount}
          totalItems={total}
          currentPage={page}
        />
      </div>
    </main>
  );
}
