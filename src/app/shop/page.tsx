import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { ShopClient } from '@/components/shop/ShopClient'

export default async function ShopPage() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    return (
      <div className="p-8 text-center pt-24">
        <h1 className="text-2xl font-bold">Loja não encontrada</h1>
      </div>
    )
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  })

  return (
    <main className="flex-1 bg-muted/20 min-h-screen">
      <div className="bg-primary text-primary-foreground py-12 px-6 mb-8 text-center shadow-sm">
        <h1 className="text-4xl font-extrabold tracking-tight">{tenant?.name || 'TCG Shop'}</h1>
        <p className="mt-4 opacity-90">Encontre as melhores opções do nosso inventário em tempo real.</p>
      </div>
      <div className="container mx-auto px-4 pb-12">
        <ShopClient tenantId={tenantId} />
      </div>
    </main>
  )
}
