import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function GET() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 401 })
  }

  try {
    const rawInventory = await prisma.inventoryItem.findMany({
      where: {
        tenantId,
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

    return NextResponse.json(inventory)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
