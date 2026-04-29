import { getTenant } from "@/lib/tenant-server";
import { cacheTag, cacheLife } from "next/cache";
import { GetStorefrontProductsUseCase } from "@/lib/application/use-cases/storefront/get-storefront-products.use-case";
import { ProductsShopClient } from "@/components/shop/products-shop-client";

const useCase = new GetStorefrontProductsUseCase();

async function getCachedProducts(tenantId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`tenant-${tenantId}-products`);
  return useCase.execute(tenantId);
}

export default async function ProductsPage() {
  const tenant = await getTenant();
  if (!tenant) {
    return null;
  }

  const { items, categories } = await getCachedProducts(tenant.id);

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl font-black tracking-tight lg:text-4xl text-foreground">
            Produtos
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Acessórios, sleeves, playmates e muito mais
          </p>
        </header>

        <ProductsShopClient initialProducts={items} categories={categories} />
      </div>
    </main>
  );
}
