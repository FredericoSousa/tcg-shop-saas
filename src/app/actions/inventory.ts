'use server'

import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { scryfall } from '@/lib/scryfall'
import { revalidatePath } from 'next/cache'
import { Condition, Language, Game, Prisma } from '@prisma/client'

export async function addInventoryItem(formData: FormData) {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    throw new Error('Unauthorized: Tenant ID missing')
  }

  const scryfallId = formData.get('scryfallId') as string
  const price = parseFloat(formData.get('price') as string)
  const quantity = parseInt(formData.get('quantity') as string, 10)
  const condition = formData.get('condition') as Condition
  const language = formData.get('language') as Language

  if (!scryfallId || isNaN(price) || isNaN(quantity) || !condition || !language) {
    throw new Error('Invalid form data')
  }

  let cardTemplate = await prisma.cardTemplate.findUnique({
    where: { id: scryfallId }
  })

  if (!cardTemplate) {
    const scryfallData = await scryfall.getCardById(scryfallId)
    if (!scryfallData) {
      throw new Error('Card not found in Scryfall')
    }

    const scryfallObj = scryfallData as Record<string, unknown>;
    const imageUris = scryfallObj.image_uris as Record<string, string> | undefined;

    cardTemplate = await prisma.cardTemplate.create({
      data: {
        id: scryfallId, // Using Scryfall ID as our global template ID
        name: scryfallData.name,
        set: scryfallData.set.toUpperCase(),
        imageUrl: imageUris?.normal || imageUris?.large || imageUris?.png || null,
        game: Game.MAGIC,
        metadata: scryfallData as unknown as Prisma.InputJsonObject
      }
    })
  }

  await prisma.inventoryItem.create({
    data: {
      tenantId,
      cardTemplateId: cardTemplate.id,
      price,
      quantity,
      condition,
      language
    }
  })

  revalidatePath('/admin/inventory')
}
