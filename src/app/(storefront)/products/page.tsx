import { getTenant } from "@/lib/tenant-server";
import { unstable_cache } from "next/cache";
import { GetStorefrontProductsUseCase } from "@/lib/application/use-cases/storefront/get-storefront-products.use-case";
import { ProductsShopClient } from "@/components/shop/products-shop-client";

const useCase = new GetStorefrontProductsUseCase();

export default async function ProductsPage() {
  const tenant = await getTenant();
  const { items, categories } = await unstable_cache(
    () => useCase.execute(tenant!.id),
    [`storefront-products-${tenant!.id}`],
    { revalidate: 3600, tags: [`tenant-${tenant!.id}-products`] },
  )();

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
