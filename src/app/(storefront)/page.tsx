import { getTenant } from '@/lib/tenant-server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ShoppingBag, Sparkles, Shield, Truck, ChevronRight } from 'lucide-react'
import { MTGCard, MTGCardItem } from '@/components/shop/mtg-card'
import Image from 'next/image'

import { LandingPage } from '@/components/landing/landing-page';

export default async function HomePage() {
  const tenant = await getTenant();

  // If no tenant subdomain, show a generic landing
  if (!tenant) {
    return <LandingPage />;
  }

  const tenantId = tenant.id;

  // Fetch cards
  const [featuredCards, recentCards] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { tenantId, active: true, quantity: { gt: 0 } },
      include: { cardTemplate: true },
      orderBy: { price: 'desc' },
      take: 8,
    }),
    prisma.inventoryItem.findMany({
      where: { tenantId, active: true, quantity: { gt: 0 } },
      include: { cardTemplate: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], // Using actual date added for most recent
      take: 4,
    }),
  ]);

  const shopName = tenant.name;

  return (
    <main className="min-h-screen bg-zinc-50 transition-colors duration-500">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center bg-zinc-950 text-white overflow-hidden py-24">
        {/* Subtle Background effect */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_theme(colors.primary)_0%,_transparent_70%)]" />

        <div className="relative container mx-auto px-6 z-10">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            {/* Brand Mark */}
            <div className="inline-block">
              {tenant?.logoUrl ? (
                <Image src={tenant.logoUrl} alt={shopName} width={200} height={80} className="h-20 w-auto object-contain mx-auto drop-shadow-2xl" />
              ) : (
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
                  <span className="text-4xl font-black text-white">{shopName.charAt(0)}</span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {!tenant?.logoUrl && (
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">
                  {shopName}
                </h1>
              )}
              <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
                {tenant?.description || "Encontre os melhores singles de Magic: The Gathering com o melhor preço e segurança."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/singles"
                className="inline-flex items-center justify-center gap-3 bg-white text-zinc-950 font-black px-8 py-4 rounded-xl transition-all hover:bg-primary hover:text-white active:scale-95 shadow-xl text-lg uppercase tracking-tighter"
              >
                <ShoppingBag className="w-5 h-5" />
                Explorar Catálogo
              </Link>
            </div>
          </div>
        </div>
      </section>
      {recentCards.length > 0 && (
        <section className="py-16 bg-zinc-50/50">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                Últimas <span className="text-primary">Novidades</span>
              </h2>
              <Link
                href="/singles?sort=id_desc"
                className="text-2xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-colors flex items-center gap-2 group"
              >
                Ver Todas
                <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {recentCards.map((item) => (
                <MTGCard
                  key={item.id}
                  item={{ ...item, price: Number(item.price) }}
                  variant="store"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Cards Section */}
      {featuredCards.length > 0 && (
        <section className="container mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">
              Cards de <span className="text-primary">Destaque</span>
            </h2>
            <Link
              href="/singles"
              className="text-2xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-colors flex items-center gap-2 group"
            >
              Catalogos Completo
              <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredCards.map((item) => (
              <MTGCard
                key={item.id}
                item={{ ...item, price: Number(item.price) } as MTGCardItem}
                variant="store"
              />
            ))}
          </div>
        </section>
      )}

      {/* Simplified trust signals */}
      <section className="container mx-auto px-6 py-16 border-t border-zinc-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center flex-shrink-0 text-zinc-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-900">Originalidade</h3>
              <p className="text-zinc-500 text-2xs uppercase font-bold mt-0.5 tracking-tight">Cards verificados 100%</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center flex-shrink-0 text-zinc-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-900">Segurança</h3>
              <p className="text-zinc-500 text-2xs uppercase font-bold mt-0.5 tracking-tight">Checkout criptografado</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center flex-shrink-0 text-zinc-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-900">Agilidade</h3>
              <p className="text-zinc-500 text-2xs uppercase font-bold mt-0.5 tracking-tight">Envio no próximo dia útil</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
