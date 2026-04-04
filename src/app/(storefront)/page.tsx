import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ShoppingBag, Sparkles, Shield, Truck } from 'lucide-react'
import { SetBadge } from '@/components/ui/set-badge'

export default async function HomePage() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  // If no tenant subdomain, show a generic landing
  if (!tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center max-w-lg px-6">
          <h1 className="text-5xl font-black tracking-tight mb-4">TCG Shop SaaS</h1>
          <p className="text-zinc-400 text-lg mb-8">Plataforma multi-loja para venda de cards. Acesse pelo subdomínio da sua loja.</p>
        </div>
      </div>
    )
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  })

  // Fetch some stats
  const [totalCards, totalSets, mostExpensiveCards] = await Promise.all([
    prisma.inventoryItem.count({ where: { tenantId, quantity: { gt: 0 } } }),
    prisma.inventoryItem.findMany({
      where: { tenantId, quantity: { gt: 0 } },
      select: { cardTemplate: { select: { set: true } } },
      distinct: ['cardTemplateId'],
    }),
    prisma.inventoryItem.findMany({
      where: { tenantId, quantity: { gt: 0 } },
      include: { cardTemplate: true },
      orderBy: { price: 'desc' },
      take: 5,
    }),
  ])

  const uniqueSets = new Set(totalSets.map(i => i.cardTemplate.set)).size
  const shopName = tenant?.name || 'TCG Shop'

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Hero Section */}
      <section className="relative bg-zinc-950 text-white overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,_theme(colors.white)_1px,_transparent_0)] [background-size:24px_24px]" />
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[400px] h-[400px] rounded-full bg-blue-500/15 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-violet-500/10 blur-[80px]" />

        <div className="relative container mx-auto py-24 md:py-32 px-6 z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Logo */}
            <div className="w-24 h-24 bg-gradient-to-br from-primary via-blue-500 to-violet-600 rounded-3xl shadow-2xl flex items-center justify-center mb-8 mx-auto transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <span className="text-5xl font-black text-white">{shopName.charAt(0)}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black font-heading tracking-tight mb-6 drop-shadow-lg leading-[1.1]">
              {shopName}
            </h1>
            <p className="text-xl md:text-2xl text-zinc-300 max-w-2xl mx-auto font-medium mb-10 leading-relaxed">
              Encontre os melhores singles de Magic: The Gathering. Estoque atualizado em tempo real.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 bg-white text-zinc-900 font-bold px-8 py-4 rounded-xl hover:bg-zinc-100 transition-all hover:scale-105 active:scale-100 shadow-lg text-lg"
              >
                <ShoppingBag className="w-5 h-5" />
                Ver Catálogo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-12 z-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border p-6 text-center hover:shadow-xl transition-shadow">
              <p className="text-3xl font-black text-primary">{totalCards}</p>
              <p className="text-sm font-semibold text-muted-foreground mt-1">Cards Disponíveis</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border p-6 text-center hover:shadow-xl transition-shadow">
              <p className="text-3xl font-black text-primary">{uniqueSets}</p>
              <p className="text-sm font-semibold text-muted-foreground mt-1">Edições</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border p-6 text-center hover:shadow-xl transition-shadow">
              <p className="text-3xl font-black text-primary">100%</p>
              <p className="text-sm font-semibold text-muted-foreground mt-1">Estoque Verificado</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cards */}
      {mostExpensiveCards.length > 0 && (
        <section className="container mx-auto px-6 pt-20 pb-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black font-heading tracking-tight">
              Destaques do Estoque
            </h2>
            <p className="text-muted-foreground mt-2 font-medium">
              Confira os últimos cards adicionados à loja
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
            {mostExpensiveCards.map((item) => (
              <Link
                key={item.id}
                href="/shop"
                className="group relative bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 duration-300"
              >
                <div className="aspect-[2/3] w-full bg-muted/30 relative overflow-hidden flex items-center justify-center">
                  {item.cardTemplate?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.cardTemplate.imageUrl}
                      alt={item.cardTemplate.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 text-xs">
                      <span>Sem Imagem</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-sm leading-tight line-clamp-2 min-h-[2.5rem]" title={item.cardTemplate?.name}>
                    {item.cardTemplate?.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] font-semibold px-1 py-0.5 bg-muted rounded border inline-flex items-center justify-center">
                      <SetBadge
                        setCode={item.cardTemplate?.set || ''}
                        className="gap-1"
                        iconClassName="h-3 w-3"
                        textClassName="text-[10px] font-semibold text-foreground tracking-normal m-0 p-0"
                      />
                    </span>
                    <span className="font-extrabold text-sm text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.price))}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-primary font-bold hover:underline text-lg"
            >
              Ver catálogo completo →
            </Link>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Cards Originais</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Todos os cards são verificados e classificados por condição (NM, SP, MP).
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Compra Segura</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Processo de checkout rápido e seguro com verificação de estoque em tempo real.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Truck className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Envio Rápido</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Pedidos processados com agilidade e enviados com proteção adequada para cards.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
