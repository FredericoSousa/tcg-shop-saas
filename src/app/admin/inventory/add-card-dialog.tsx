'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { searchScryfallServer } from '@/app/actions/scryfall'
import { addInventoryItem } from '@/app/actions/inventory'
import { toast } from 'sonner'
import type { ScryfallCard } from '@scryfall/api-types'

type Card = ScryfallCard.Any

export function AddCardDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Card[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!query) return
    setIsSearching(true)
    try {
      const cards = await searchScryfallServer(query)
      setResults(cards as Card[])
    } catch {
      toast.error('Erro ao buscar o card.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await addInventoryItem(formData)
        toast.success('Card adicionado ao inventário!')
        setOpen(false)
        setQuery('')
        setResults([])
        setSelectedCardId('')
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao salvar o card'
        toast.error(msg)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Adicionar Card</Button>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Adicionar Card ao Estoque</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nome do card (ex: Black Lotus)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              autoFocus
            />
            <Button onClick={handleSearch} disabled={isSearching} className="w-24">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
            </Button>
          </div>

          <form action={handleSubmit} className="flex flex-col gap-4">
            {results.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Selecione a Edição</label>
                <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
                  {results.map((card) => {
                    const cardObj = card as Record<string, unknown>;
                    const imageUris = cardObj.image_uris as Record<string, string> | undefined;
                    const imageUrl = imageUris?.small || imageUris?.normal || (cardObj as any).card_faces[0].image_uris.normal || '';
                    return (
                      <label
                        key={card.id}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted ${selectedCardId === card.id ? 'bg-muted border border-primary' : ''}`}
                      >
                        <input
                          type="radio"
                          name="scryfallId"
                          value={card.id}
                          className="hidden"
                          checked={selectedCardId === card.id}
                          onChange={() => setSelectedCardId(card.id)}
                          required
                        />
                        <div className="w-12 h-16 relative bg-muted rounded shrink-0">
                          {imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imageUrl} alt={card.name} className="object-cover rounded w-full h-full" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold">{card.name}</span>
                          <span className="text-xs text-muted-foreground">{card.set_name} ({card.set.toUpperCase()})</span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedCardId && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Preço (R$)</label>
                  <Input type="number" step="0.01" name="price" required placeholder="0.00" min="0" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Quantidade</label>
                  <Input type="number" name="quantity" required defaultValue="1" min="1" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Condição</label>
                  <Select name="condition" defaultValue="NM" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NM">Near Mint (NM)</SelectItem>
                      <SelectItem value="SP">Slightly Played (SP)</SelectItem>
                      <SelectItem value="MP">Moderately Played (MP)</SelectItem>
                      <SelectItem value="HP">Heavily Played (HP)</SelectItem>
                      <SelectItem value="D">Damaged (D)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Idioma</label>
                  <Select name="language" defaultValue="EN" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EN">Inglês (EN)</SelectItem>
                      <SelectItem value="PT">Português (PT)</SelectItem>
                      <SelectItem value="JP">Japonês (JP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={!selectedCardId || isPending}>
                {isPending ? 'Salvando...' : 'Salvar no Estoque'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
