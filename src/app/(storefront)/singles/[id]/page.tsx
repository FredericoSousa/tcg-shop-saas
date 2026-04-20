import "reflect-metadata";
import { container } from "@/lib/infrastructure/container";
import { GetInventoryItemUseCase } from "@/lib/application/use-cases/get-inventory-item.use-case";
import { GetStorefrontInventoryUseCase } from "@/lib/application/use-cases/get-storefront-inventory.use-case";
import { getTenant } from "@/lib/tenant-server";
import { ProductDetailClient } from "@/components/shop/product-detail-client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SetBadge } from "@/components/ui/set-badge";
import { formatCurrency } from "@/lib/utils/format";
import { ChevronRight, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const tenant = await getTenant();
  if (!tenant) return {};

  const getInventoryItem = container.resolve(GetInventoryItemUseCase);
  const item = await getInventoryItem.execute({ id: params.id, tenantId: tenant.id });
  if (!item) return {};

  return {
    title: `${item.cardTemplate?.name} - ${item.cardTemplate?.set?.toUpperCase()} | ${tenant.name}`,
    description: `Compre ${item.cardTemplate?.name} (${item.condition}) na ${tenant.name}. Os melhores preços de Magic: The Gathering.`,
    openGraph: {
      images: item.cardTemplate?.imageUrl ? [item.cardTemplate.imageUrl] : [],
    },
  };
}

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const tenant = await getTenant();

  if (!tenant) return notFound();

  const getInventoryItem = container.resolve(GetInventoryItemUseCase);
  const getItem = await getInventoryItem.execute({ id: params.id, tenantId: tenant.id });

  if (!getItem) return notFound();

  // Fetch related products (same set)
  const getInventory = container.resolve(GetStorefrontInventoryUseCase);
  const relatedResponse = await getInventory.execute({
    tenantId: tenant.id,
    page: 1,
    filters: { set: getItem.cardTemplate?.set }
  });

  const relatedProducts = relatedResponse.items
    .filter(i => i.id !== getItem.id)
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-zinc-50 border-b border-zinc-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
            <Link href="/" className="hover:text-zinc-950 transition-colors">Início</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/singles" className="hover:text-zinc-950 transition-colors">Singles</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-zinc-950 truncate max-w-[200px]">{getItem.cardTemplate?.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 md:py-20">
        <Link
          href="/singles"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-950 transition-all font-black text-xs uppercase tracking-widest mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Voltar para Catalogos
        </Link>

        <ProductDetailClient item={getItem} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-32 space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                Mais da coleção <span className="text-primary">{getItem.cardTemplate?.set?.toUpperCase()}</span>
              </h2>
              <Link
                href={`/singles?set=${getItem.cardTemplate?.set}`}
                className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-primary transition-colors"
              >
                Ver Coleção Completa →
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((related) => (
                <Link
                  key={related.id}
                  href={`/singles/${related.id}`}
                  className="group block space-y-4"
                >
                  <div className="aspect-[2/3] relative rounded-3xl overflow-hidden bg-zinc-100 border border-zinc-200 transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
                    {related.cardTemplate?.imageUrl && (
                      <Image
                        src={related.cardTemplate.imageUrl}
                        alt={related.cardTemplate.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-zinc-900 group-hover:text-primary transition-colors truncate">{related.cardTemplate?.name}</h4>
                    <div className="flex items-center justify-between">
                      <SetBadge setCode={related.cardTemplate?.set || ""} setName={(related.cardTemplate?.metadata as { set_name?: string } | null | undefined)?.set_name} showText={false} iconClassName="h-3 w-3" />
                      <span className="font-black text-primary text-sm">{formatCurrency(related.price)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
