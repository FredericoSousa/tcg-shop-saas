import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { DataTable } from './data-table'
import { columns } from './columns'
import { AddCardDialog } from './add-card-dialog'

export default async function InventoryPage() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Autenticação Necessária</h1>
        <p className="text-muted-foreground">Você precisa estar em um subdomínio válido de lojista ou logado para acessar esta página.</p>
      </div>
    )
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  })

  const rawInventory = await prisma.inventoryItem.findMany({
    where: { tenantId },
    include: {
      cardTemplate: true
    },
    orderBy: {
      cardTemplate: { name: 'asc' }
    }
  })

  const inventory = rawInventory.map(item => ({
    id: item.id,
    price: Number(item.price), // converting Prisma Decimal to Number for client
    quantity: item.quantity,
    condition: item.condition,
    language: item.language,
    cardTemplate: {
      name: item.cardTemplate.name,
      set: item.cardTemplate.set,
      imageUrl: item.cardTemplate.imageUrl
    }
  }))

  return (
    <div className="container mx-auto p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-muted-foreground">Gerencie o inventário da loja {tenant?.name || 'sua loja'}.</p>
        </div>
        <AddCardDialog />
      </div>
      
      <DataTable columns={columns} data={inventory} />
    </div>
  )
}
