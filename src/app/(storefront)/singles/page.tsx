import "reflect-metadata";
import { container } from "@/lib/infrastructure/container";
import { GetStorefrontInventoryUseCase } from "@/lib/application/use-cases/storefront/get-storefront-inventory.use-case";
import { GetStorefrontFiltersUseCase } from "@/lib/application/use-cases/storefront/get-storefront-filters.use-case";
import { ShopClient } from "@/components/shop/shop-client";
import { Sparkles } from "lucide-react";
import { getTenant } from "@/lib/tenant-server";
import { cacheTag, cacheLife } from "next/cache";

type InventoryFilters = {
  color?: string;
  type?: string;
  subtype?: string;
  set?: string;
  extras?: string;
  language?: string;
  search?: string;
  sort?: string;
};

async function getCachedInventory(
  tenantId: string,
  page: number,
  filters: InventoryFilters,
) {
  "use cache";
  cacheLife("hours");
  cacheTag(`tenant-${tenantId}-inventory`);
  const useCase = container.resolve(GetStorefrontInventoryUseCase);
  return useCase.execute({ tenantId, page, filters });
}

async function getCachedFilters(tenantId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`tenant-${tenantId}-inventory`);
  const useCase = container.resolve(GetStorefrontFiltersUseCase);
  return useCase.execute({ tenantId });
}

export default async function ShopPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const filters: InventoryFilters = {
    color: typeof searchParams?.color === "string" ? searchParams.color : undefined,
    type: typeof searchParams?.type === "string" ? searchParams.type : undefined,
    subtype: typeof searchParams?.subtype === "string" ? searchParams.subtype : undefined,
    set: typeof searchParams?.set === "string" ? searchParams.set : undefined,
    extras: typeof searchParams?.extras === "string" ? searchParams.extras : undefined,
    language: typeof searchParams?.language === "string" ? searchParams.language : undefined,
    search: typeof searchParams?.q === "string" ? searchParams.q : undefined,
    sort: typeof searchParams?.sort === "string" ? searchParams.sort : undefined,
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
          <p className="text-muted-foreground text-sm">
            Não foi possível identificar o lojista para esta página.
          </p>
        </div>
      </div>
    );
  }

  const [inventoryResponse, storefrontFilters] = await Promise.all([
    getCachedInventory(tenant.id, page, filters),
    getCachedFilters(tenant.id),
  ]);

  const { items: inventory, total, pageCount } = inventoryResponse;

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl font-black tracking-tight lg:text-4xl text-foreground">Singles</h1>
          <p className="text-muted-foreground mt-2 text-lg">Encontre o card perfeito para o seu deck</p>
        </header>

        <ShopClient
          tenantId={tenant.id}
          initialInventory={inventory}
          availableFilters={storefrontFilters}
          pageCount={pageCount}
          totalItems={total}
          currentPage={page}
        />
      </div>
    </main>
  );
}
