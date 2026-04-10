import { getTenant } from '@/lib/tenant-server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ShoppingBag, Sparkles, Shield, Truck, ChevronRight } from 'lucide-react'
import { SetBadge } from '@/components/ui/set-badge'
import { formatCurrency } from '@/lib/utils/format'

export default async function HomePage() {
  const tenant = await getTenant();

  // If no tenant subdomain, show a generic landing
  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center max-w-lg px-6">
          <h1 className="text-5xl font-black tracking-tight mb-4">TCG Shop SaaS</h1>
          <p className="text-zinc-400 text-lg mb-8">Plataforma multi-loja para venda de cards. Acesse pelo subdomínio da sua loja.</p>
        </div>
      </div>
    );
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
      orderBy: { id: 'desc' }, // Using ID desc as a proxy for most recent
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
                <img src={tenant.logoUrl} alt={shopName} className="h-20 w-auto object-contain mx-auto drop-shadow-2xl" />
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
                className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-colors flex items-center gap-2 group"
              >
                Ver Todas
                <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {recentCards.map((item) => (
                <Link
                  key={item.id}
                  href={`/singles/${item.id}`}
                  className="group block space-y-3"
                >
                  <div className="aspect-[2/3] relative rounded-2xl overflow-hidden bg-white border border-zinc-100 transition-all duration-300 group-hover:border-primary/30">
                    {item.cardTemplate?.imageUrl && (
                      <img 
                        src={item.cardTemplate.imageUrl} 
                        alt={item.cardTemplate.name}
                        className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
                      />
                    )}
                  </div>
                  <div className="px-1 space-y-0.5">
                    <h4 className="font-bold text-sm text-zinc-900 truncate group-hover:text-primary transition-colors">{item.cardTemplate?.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{item.cardTemplate?.set}</span>
                      <span className="font-black text-primary text-sm">{formatCurrency(item.price)}</span>
                    </div>
                  </div>
                </Link>
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
                className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-colors flex items-center gap-2 group"
              >
                Catalogos Completo
                <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredCards.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden hover:border-primary/30 transition-all duration-300"
              >
                <div className="aspect-[2/3] w-full bg-zinc-50 relative overflow-hidden flex items-center justify-center">
                  {item.cardTemplate?.imageUrl && (
                    <img
                      src={item.cardTemplate.imageUrl}
                      alt={item.cardTemplate.name}
                      className="object-cover w-full h-full grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
                      loading="lazy"
                    />
                  )}
                  <Link href={`/singles/${item.id}`} className="absolute inset-0 z-20" />
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <h3 className="font-bold text-zinc-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                    {item.cardTemplate?.name}
                  </h3>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-50">
                    <SetBadge setCode={item.cardTemplate?.set || ''} className="bg-transparent p-0" iconClassName="h-3 w-3" textClassName="text-[10px] font-bold text-zinc-400" />
                    <span className="font-black text-primary text-sm">
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                </div>
              </div>
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
              <p className="text-zinc-500 text-[10px] uppercase font-bold mt-0.5 tracking-tight">Cards verificados 100%</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center flex-shrink-0 text-zinc-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-900">Segurança</h3>
              <p className="text-zinc-500 text-[10px] uppercase font-bold mt-0.5 tracking-tight">Checkout criptografado</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center flex-shrink-0 text-zinc-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-900">Agilidade</h3>
              <p className="text-zinc-500 text-[10px] uppercase font-bold mt-0.5 tracking-tight">Envio no próximo dia útil</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
