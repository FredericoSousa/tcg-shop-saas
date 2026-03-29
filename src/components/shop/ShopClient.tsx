'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCart } from '@/store/useCart'
import { CartDrawer } from './CartDrawer'

type ShopItem = {
  id: string;
  price: number;
  quantity: number;
  condition: string;
  language: string;
  cardTemplate: {
    name: string;
    set: string;
    imageUrl: string | null;
    metadata: {
      colors?: string[];
      type_line?: string;
      foil?: boolean;
    } | null;
  } | null;
}

export function ShopClient({ tenantId }: { tenantId: string }) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedSet, setSelectedSet] = useState<string | null>(null)
  
  const { addItem } = useCart()

  const { data: inventory, isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await fetch('/api/inventory', {
        headers: {
          'x-tenant-id': tenantId || '',
        },
      })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  const { colors, types, sets } = useMemo(() => {
    if (!inventory) return { colors: [], types: [], sets: [] }

    const colorSet = new Set<string>()
    const typeSet = new Set<string>()
    const setSet = new Set<string>()

    inventory.forEach((item: ShopItem) => {
      const meta = item.cardTemplate?.metadata
      if (meta?.colors && Array.isArray(meta.colors)) {
        meta.colors.forEach((c: string) => colorSet.add(c))
      }
      if (meta?.type_line) {
        const mainType = meta.type_line.split('—')[0].trim().split(' ')[0]
        if (mainType) typeSet.add(mainType)
      }
      if (item.cardTemplate?.set) {
        setSet.add(item.cardTemplate.set.toUpperCase())
      }
    })

    return {
      colors: Array.from(colorSet).sort(),
      types: Array.from(typeSet).sort(),
      sets: Array.from(setSet).sort()
    }
  }, [inventory])

  const filteredInventory = useMemo(() => {
    if (!inventory) return []
    return inventory.filter((item: ShopItem) => {
      const meta = item.cardTemplate?.metadata
      if (selectedColor && (!meta?.colors || !meta.colors.includes(selectedColor))) return false
      if (selectedType && (!meta?.type_line || !meta.type_line.includes(selectedType))) return false
      if (selectedSet && item.cardTemplate?.set?.toUpperCase() !== selectedSet) return false
      return true
    })
  }, [inventory, selectedColor, selectedType, selectedSet])

  if (isLoading) return <div className="text-center py-20 animate-pulse text-muted-foreground">Carregando catálogo da loja...</div>
  if (error) return <div className="text-center py-20 text-red-500 font-medium">Erro ao carregar o estoque. Tente novamente mais tarde.</div>

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      <aside className="w-full md:w-64 shrink-0 space-y-8 bg-white p-6 rounded-xl border shadow-sm sticky top-6">
        <div>
          <h3 className="text-lg font-bold mb-4">Filtrar por Cor</h3>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedColor === null ? 'default' : 'outline'}
              className="cursor-pointer hover:opacity-80 pb-0.5"
              onClick={() => setSelectedColor(null)}
            >
              Todas
            </Badge>
            {colors.map(c => (
              <Badge
                key={c}
                variant={selectedColor === c ? 'default' : 'outline'}
                className="cursor-pointer hover:opacity-80 pb-0.5"
                onClick={() => setSelectedColor(c)}
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">Filtrar por Tipo</h3>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedType === null ? 'default' : 'outline'}
              className="cursor-pointer hover:opacity-80 pb-0.5"
              onClick={() => setSelectedType(null)}
            >
              Todos
            </Badge>
            {types.map(t => (
              <Badge
                key={t}
                variant={selectedType === t ? 'default' : 'outline'}
                className="cursor-pointer hover:opacity-80 pb-0.5"
                onClick={() => setSelectedType(t)}
              >
                {t}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">Filtrar por Edição</h3>
          <div className="flex flex-col gap-1.5 border-l-2 pl-3">
            <button
              className={`text-left text-sm py-1 font-medium transition-colors ${selectedSet === null ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'}`}
              onClick={() => setSelectedSet(null)}
            >
              Todas as Edições
            </button>
            {sets.map(s => (
              <button
                key={s}
                className={`text-left text-sm py-1 font-medium transition-colors ${selectedSet === s ? 'text-primary' : 'text-muted-foreground hover:text-primary/70'}`}
                onClick={() => setSelectedSet(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <div className="mb-6 flex justify-between items-center">
          <span className="text-sm font-medium bg-muted px-3 py-1 rounded-full text-muted-foreground">
            Encontrados: {filteredInventory.length} cards
          </span>
        </div>

        {filteredInventory.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-xl border border-dashed text-muted-foreground">
            Nenhum card correspondente aos filtros foi encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredInventory.map((item: ShopItem) => (
              <div key={item.id} className="group relative flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border hover:shadow-lg transition-all hover:-translate-y-1 duration-300">
                <div className="aspect-[2/3] w-full bg-gray-100 relative overflow-hidden">
                  {item.cardTemplate?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.cardTemplate.imageUrl}
                      alt={item.cardTemplate.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-medium">Sem Imagem</div>
                  )}
                  {item.cardTemplate?.metadata?.foil && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-300 to-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      FOIL
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-1.5 flex-1">
                  <h3 className="font-bold text-sm leading-tight" title={item.cardTemplate?.name}>
                    {item.cardTemplate?.name}
                  </h3>
                  <div className="flex items-center flex-wrap gap-1 mt-auto">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-muted rounded border border-gray-200">
                      {item.cardTemplate?.set}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-muted rounded border border-gray-200">
                      {item.condition}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-muted rounded border border-gray-200">
                      {item.language}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t flex flex-col gap-3">
                    <div className="flex items-end justify-between">
                      <span className="font-extrabold text-lg text-primary leading-none">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                      </span>
                      <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">
                        {item.quantity} em estoque
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full font-bold text-xs h-8" 
                      onClick={() => addItem({
                        inventoryId: item.id,
                        name: item.cardTemplate?.name || 'Card',
                        set: item.cardTemplate?.set || 'N/A',
                        imageUrl: item.cardTemplate?.imageUrl || null,
                        price: item.price,
                        quantity: 1,
                        maxStock: item.quantity
                      })}
                    >
                      Comprar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <CartDrawer />
      </div>
    </div>
  )
}
