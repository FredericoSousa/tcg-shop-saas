import { getTenant } from '@/lib/tenant-server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const tenant = await getTenant()

  if (!tenant) {
    return Response.json({ error: 'Tenant not found' }, { status: 401 })
  }

  try {
    const rawInventory = await prisma.inventoryItem.findMany({
      where: {
        active: true,
        quantity: { gt: 0 } // Only active stock on the storefront
      },
      include: {
        cardTemplate: true
      },
      orderBy: {
        cardTemplate: { name: 'asc' }
      }
    })

    // Map the Decimal field to normal Number for JSON parsing
    const inventory = rawInventory.map(item => ({
      ...item,
      price: Number(item.price),
    }))

    return Response.json(inventory)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
