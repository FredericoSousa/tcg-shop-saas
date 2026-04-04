'use server'

import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { scryfall } from '@/lib/scryfall'
import { revalidatePath } from 'next/cache'
import { Condition, Language, Game, Prisma } from '@prisma/client'
import { getCollectionById } from '@/lib/ligaMagic'

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
        imageUrl: imageUris?.normal
          || imageUris?.large
          || imageUris?.png
          || (scryfallData as any).card_faces[0].image_uris.normal
          || null,
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

export async function deleteInventoryItems(ids: string[]) {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    throw new Error('Unauthorized: Tenant ID missing')
  }

  if (!ids.length) {
    throw new Error('No items selected')
  }

  await prisma.inventoryItem.deleteMany({
    where: {
      id: { in: ids },
      tenantId, // Ensure tenant isolation
    },
  })

  revalidatePath('/admin/inventory')
}

export type BulkItem = {
  cardName: string
  quantity: number
  condition: Condition
  language: Language
  price: number
}

export type BulkItemResult = {
  cardName: string
  quantity: number
  condition: string
  language: string
  price: number
  status: 'success' | 'error'
  error?: string
  scryfallId?: string
  imageUrl?: string
  setName?: string
  setCode?: string
  cardNumber?: number
}

export async function searchCardByName(name: string, setCode?: string, cardNumber?: number): Promise<BulkItemResult | null> {
  try {
    let query = `!"${name}"`
    if (setCode) {
      query += ` set:${setCode.toLowerCase()}`
    }
    if (cardNumber) {
      query += ` number:${cardNumber}`
    }
    const cards = await scryfall.searchCards(query)
    if (!cards.length) return null

    const card = cards[0]
    const cardObj = card as Record<string, unknown>
    const imageUris = cardObj.image_uris as Record<string, string> | undefined

    return {
      cardName: card.name,
      quantity: 1,
      condition: 'NM',
      language: 'EN',
      price: 0,
      status: 'success',
      scryfallId: card.id,
      imageUrl: imageUris?.small || imageUris?.normal || (card as any).card_faces?.[0]?.image_uris?.small || '',
      setName: card.set_name,
      setCode: card.set.toUpperCase(),
      cardNumber: cardObj.collector_number ? parseInt(cardObj.collector_number as string, 10) : undefined,
    }
  } catch {
    return null
  }
}

export async function addBulkInventoryItems(items: { scryfallId: string; quantity: number; condition: Condition; language: Language; price: number }[]) {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    throw new Error('Unauthorized: Tenant ID missing')
  }

  if (!items.length) {
    throw new Error('No items to add')
  }

  const results: { cardName: string; status: 'success' | 'error'; error?: string }[] = []

  // Pre-fetch all missing card templates outside the transaction
  const uniqueScryfallIds = Array.from(new Set(items.map(i => i.scryfallId)))
  
  const existingTemplates = await prisma.cardTemplate.findMany({
    where: { id: { in: uniqueScryfallIds } },
    select: { id: true, name: true }
  })
  const existingIds = new Set(existingTemplates.map(t => t.id))
  
  const missingScryfallIds = uniqueScryfallIds.filter(id => !existingIds.has(id))
  
  const fetchedScryfallData = new Map<string, any>()
  for (const id of missingScryfallIds) {
    const data = await scryfall.getCardById(id)
    if (data) {
      fetchedScryfallData.set(id, data)
    }
  }

  // Fast database transaction for mutations only
  await prisma.$transaction(async (tx) => {
    // Keep track of names for response
    const nameMap = new Map<string, string>()
    for (const t of existingTemplates) {
      nameMap.set(t.id, t.name)
    }

    // 1. Create missing templates
    for (const id of missingScryfallIds) {
      const scryfallData = fetchedScryfallData.get(id)
      if (!scryfallData) continue

      const scryfallObj = scryfallData as Record<string, unknown>
      const imageUris = scryfallObj.image_uris as Record<string, string> | undefined

      const newTemplate = await tx.cardTemplate.create({
        data: {
          id: id,
          name: scryfallData.name,
          set: scryfallData.set.toUpperCase(),
          imageUrl: imageUris?.normal
            || imageUris?.large
            || imageUris?.png
            || (scryfallData as any).card_faces?.[0]?.image_uris?.normal
            || null,
          game: Game.MAGIC,
          metadata: scryfallData as unknown as Prisma.InputJsonObject
        }
      })
      nameMap.set(id, newTemplate.name)
    }

    // 2. Create inventory items
    for (const item of items) {
      // Check if template exists (either existing or just created)
      if (!nameMap.has(item.scryfallId)) {
        results.push({ cardName: item.scryfallId, status: 'error', error: 'Card not found in Scryfall' })
        continue
      }

      await tx.inventoryItem.create({
        data: {
          tenantId,
          cardTemplateId: item.scryfallId,
          price: item.price,
          quantity: item.quantity,
          condition: item.condition,
          language: item.language
        }
      })

      results.push({ cardName: nameMap.get(item.scryfallId)!, status: 'success' })
    }
  }, { timeout: 15000 }) // increased timeout just in case it's a huge bulk

  revalidatePath('/admin/inventory')
  return results
}

const LM_CONDITION_MAP: Record<string, Condition> = {
  'M': 'NM', 'NM': 'NM', 'SP': 'SP', 'MP': 'MP', 'HP': 'HP', 'D': 'D',
}

const LM_LANGUAGE_MAP: Record<string, Language> = {
  'en': 'EN', 'pt': 'PT', 'jp': 'JP', 'ja': 'JP',
}

export async function importLigaMagicCollection(collectionId: string): Promise<(BulkItemResult & { originalLine: string })[]> {
  if (!collectionId.trim()) {
    throw new Error('ID da coleção é obrigatório')
  }

  const cards = await getCollectionById(collectionId.trim())

  if (!cards.length) {
    throw new Error('Nenhum card encontrado na coleção')
  }

  return cards.map((card) => {
    const condition = LM_CONDITION_MAP[card.condition ?? ''] || 'NM'
    const language = LM_LANGUAGE_MAP[card.language?.toLowerCase() ?? ''] || 'EN'

    return {
      cardName: (card as any).name ?? 'Unknown',
      quantity: card.quantity || 1,
      condition,
      language,
      price: card.price || 0,
      status: 'success' as const,
      setCode: card.set?.toUpperCase(),
      cardNumber: card.cardNumber || undefined,
      originalLine: `${card.quantity} ${(card as any).name} [${card.set?.toUpperCase() ?? '?'}] #${card.cardNumber}`,
    }
  })
}
