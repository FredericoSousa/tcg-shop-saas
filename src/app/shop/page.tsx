import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { ShopClient } from '@/components/shop/ShopClient'

export default async function ShopPage() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    return (
      <div className="p-8 text-center pt-24 min-h-screen flex items-center justify-center bg-muted/20">
        <div className="bg-white p-12 rounded-2xl shadow-sm border max-w-md w-full">
          <h1 className="text-2xl font-black mb-4">Loja não encontrada</h1>
          <p className="text-muted-foreground">Não foi possível identificar o lojista para esta página.</p>
        </div>
      </div>
    )
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  })

  return (
    <main className="flex-1 bg-muted/10 min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-zinc-950 text-white overflow-hidden shadow-md">
        {/* Subtle background pattern - representing cards / lógic */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,_theme(colors.white)_1px,_transparent_0)] [background-size:24px_24px]"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl rounded-full"></div>
        
        <div className="relative container mx-auto py-16 px-6 text-center z-10 flex flex-col items-center">
          {/* Avatar Placeholder */}
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-xl flex items-center justify-center mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="text-3xl font-black text-white">{tenant?.name?.charAt(0) || 'T'}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 drop-shadow-md">
            {tenant?.name || 'TCG Shop'}
          </h1>
          <p className="mt-2 text-lg text-zinc-300 max-w-xl mx-auto font-medium">
            O baú do tesouro oficial de cards do {tenant?.name || 'nosso lojista'}. Encontre singles em tempo real.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 pt-8">
        <ShopClient tenantId={tenantId} />
      </div>
    </main>
  )
}
