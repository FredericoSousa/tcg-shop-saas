'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2, CheckCircle2, XCircle, Upload, FileText, ArrowRight, Globe, AlertTriangle, RefreshCw } from 'lucide-react'
import { searchCardByName, resolveCardsBatch, addBulkInventoryItems, importLigaMagicCollection } from '@/app/actions/inventory'
import type { BulkItemResult } from '@/app/actions/inventory'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { SetBadge } from '@/components/ui/set-badge'
import { ChipListInput } from '@/components/ui/chip-list-input'

type ParsedLine = {
  quantity: number
  cardName: string
  setCode: string
  cardNumber?: string
  condition: string
  language: string
  price: number
  extras: string[]
  raw: string
}

const VALID_CONDITIONS = ['NM', 'SP', 'MP', 'HP', 'D']
const VALID_LANGUAGES = ['EN', 'PT', 'JP']
const VALID_EXTRAS = ['FOIL', 'PROMO', 'PRE_RELEASE', 'FNM', 'DCI', 'TEXTLESS', 'SIGNED', 'OVERSIZED', 'ALTERED', 'FOIL_ETCHED', 'MISPRINT', 'MISCUT']

const EXAMPLE_TEXT = `4 Lightning Bolt [M25] #169 NM EN 2.50
2 Counterspell [TMP] SP PT 5.00
1 Black Lotus [LEA] #232 NM EN 25000.00
3 Sol Ring [C21] MP EN 15.00`

function parseLine(line: string): ParsedLine | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return null

  // Format: <qty> <card name> [SET] <condition> <language> <price>
  // [SET] is optional, e.g. [M25], (LEA), M25
  // Price is the last token, language second-to-last, condition third-to-last
  const tokens = trimmed.split(/\s+/)
  if (tokens.length < 5) return null

  const quantity = parseInt(tokens[0], 10)
  if (isNaN(quantity) || quantity < 1) return null

  const price = parseFloat(tokens[tokens.length - 1].replace(',', '.'))
  if (isNaN(price) || price < 0) return null

  const language = tokens[tokens.length - 2].toUpperCase()
  const condition = tokens[tokens.length - 3].toUpperCase()

  if (!VALID_CONDITIONS.includes(condition)) return null
  if (!VALID_LANGUAGES.includes(language)) return null

  const nameTokens = tokens.slice(1, tokens.length - 3)

  let setCode: string | undefined
  let cardNumber: string | undefined

  // Extract optional #NUMBER
  const numTokenIndex = nameTokens.findIndex(t => /^#\d+$/.test(t))
  if (numTokenIndex !== -1) {
    cardNumber = nameTokens[numTokenIndex].replace('#', '')
    nameTokens.splice(numTokenIndex, 1)
  }

  // Extract optional [SET] or (SET)
  const setTokenIndex = nameTokens.findIndex(t => /^\[.+\]$/.test(t) || /^\(.+\)$/.test(t))
  if (setTokenIndex !== -1) {
    setCode = nameTokens[setTokenIndex].replace(/[\[\]\(\)]/g, '').toUpperCase()
    nameTokens.splice(setTokenIndex, 1)
  }

  const extras: string[] = []
  while (nameTokens.length > 0 && VALID_EXTRAS.includes(nameTokens[nameTokens.length - 1].toUpperCase())) {
    extras.unshift(nameTokens.pop()!.toUpperCase())
  }

  const cardName = nameTokens.join(' ')
  if (!cardName) return null

  return { quantity, cardName, setCode: setCode || '', cardNumber, condition, language, price, extras, raw: trimmed }
}

type ImportMode = 'text' | 'ligamagic'

export function BulkImportForm() {
  const [importMode, setImportMode] = useState<ImportMode>('text')
  const [textInput, setTextInput] = useState('')
  const [ligamagicId, setLigamagicId] = useState('')
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [items, setItems] = useState<(BulkItemResult & { originalLine: string })[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 })
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // === Text import handler ===
  const handleProcessText = async () => {
    const lines = textInput.split('\n').filter(l => l.trim())
    const parsed: ParsedLine[] = []
    const errors: string[] = []

    lines.forEach((line, i) => {
      const result = parseLine(line)
      if (result) {
        parsed.push(result)
      } else if (line.trim() && !line.trim().startsWith('#') && !line.trim().startsWith('//')) {
        errors.push(`Linha ${i + 1}: formato inválido — "${line.trim()}"`)
      }
    })

    if (errors.length) {
      toast.error(`${errors.length} linha(s) com erro de formato`, {
        description: errors.slice(0, 3).join('\n'),
        duration: 6000,
      })
    }

    if (!parsed.length) {
      toast.error('Nenhuma linha válida encontrada.')
      return
    }

    setIsProcessing(true)

    // Merge duplicates
    const mergedParsed = parsed.reduce((acc, curr) => {
      const key = `${curr.cardName.toLowerCase()}|${curr.setCode}|${curr.cardNumber || ''}|${curr.condition}|${curr.language}|${curr.price}|${curr.extras.join(',')}`;
      if (acc[key]) {
        acc[key].quantity += curr.quantity;
      } else {
        acc[key] = { ...curr };
      }
      return acc;
    }, {} as Record<string, ParsedLine>);
    const parsedListToResolve = Object.values(mergedParsed);

    setProcessProgress({ current: parsedListToResolve.length, total: parsedListToResolve.length })

    const batchRequest = parsedListToResolve.map(p => ({
      cardName: p.cardName,
      setCode: p.setCode || undefined,
      cardNumber: p.cardNumber,
      quantity: p.quantity,
      condition: p.condition,
      language: p.language,
      price: p.price,
      extras: p.extras,
      originalLine: p.raw
    }));

    const CHUNK_SIZE = 75;
    let results: any[] = [];
    for (let i = 0; i < batchRequest.length; i += CHUNK_SIZE) {
      const chunk = batchRequest.slice(i, i + CHUNK_SIZE);
      const chunkResults = await resolveCardsBatch(chunk);
      results = results.concat(chunkResults);
    }

    setItems(results)
    setIsProcessing(false)
    setStep('preview')
  }

  // === Liga Magic import handler ===
  const handleProcessLigaMagic = async () => {
    if (!ligamagicId.trim()) {
      toast.error('Informe o ID da coleção da Liga Magic.')
      return
    }

    setIsProcessing(true)

    try {
      const collectionCards = await importLigaMagicCollection(ligamagicId)

      if (!collectionCards.length) {
        toast.error('Nenhum card encontrado na coleção.')
        setIsProcessing(false)
        return
      }

      // Now resolve each card via Scryfall in chunks of 75
      const batchRequest = collectionCards.map(card => ({
        cardName: card.cardName,
        setCode: card.setCode || undefined,
        cardNumber: card.cardNumber,
        quantity: card.quantity,
        condition: card.condition,
        language: card.language,
        price: card.price,
        extras: card.extras,
        originalLine: card.originalLine
      }));

      const CHUNK_SIZE = 75;
      let results: any[] = [];
      for (let i = 0; i < batchRequest.length; i += CHUNK_SIZE) {
        const chunk = batchRequest.slice(i, i + CHUNK_SIZE);
        const chunkResults = await resolveCardsBatch(chunk);
        results = results.concat(chunkResults);
      }

      setItems(results)
      setStep('preview')
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao importar coleção'
      toast.error(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateItem = (index: number, field: string, value: string | number | string[]) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      return { ...item, [field]: value }
    }))
  }

  const [reResolvingIndex, setReResolvingIndex] = useState<number | null>(null)

  const handleReResolve = async (index: number) => {
    const item = items[index]
    if (!item) return

    setReResolvingIndex(index)
    try {
      // Use the normal search API directly for re-processing since it supports fuzzy matching via the text search API
      const found = await searchCardByName(item.cardName, item.setCode, item.cardNumber);

      if (found && found.status === 'success') {
        const resultItem = {
          ...item,
          ...found,
          quantity: item.quantity,
          condition: item.condition,
          language: item.language,
          price: item.price,
          status: 'success' as const
        };

        setItems(prev => prev.map((it, i) => {
          if (i !== index) return it
          return resultItem;
        }))
      } else {
        setItems(prev => prev.map((it, i) => {
          if (i !== index) return it
          return { ...it, status: 'error' as const, error: `Não encontrado com nome "${it.cardName}" e set "${it.setCode || '(vazio)'}"`, scryfallId: undefined, imageUrl: undefined }
        }))
      }
    } catch {
      toast.error('Erro ao buscar no Scryfall')
    } finally {
      setReResolvingIndex(null)
    }
  }

  const successItems = items.filter(i => i.status === 'success' && i.scryfallId)
  const errorItems = items.filter(i => i.status === 'error')

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        const toAdd = successItems.map(item => ({
          scryfallId: item.scryfallId!,
          quantity: item.quantity,
          condition: item.condition as 'NM' | 'SP' | 'MP' | 'HP' | 'D',
          language: item.language as 'EN' | 'PT' | 'JP',
          price: item.price,
          extras: item.extras || [],
        }))

        const CHUNK_SIZE = 50;
        let totalSuccesses = 0;
        let totalErrors = 0;

        for (let i = 0; i < toAdd.length; i += CHUNK_SIZE) {
          const chunk = toAdd.slice(i, i + CHUNK_SIZE);
          const results = await addBulkInventoryItems(chunk);

          totalSuccesses += results.filter(r => r.status === 'success').length;
          totalErrors += results.filter(r => r.status === 'error').length;
        }

        if (totalSuccesses > 0) {
          toast.success(`${totalSuccesses} card(s) adicionados ao estoque!`)
        }
        if (totalErrors > 0) {
          toast.error(`${totalErrors} card(s) falharam ao salvar.`)
        }

        router.push('/admin/inventory')
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao salvar'
        toast.error(msg)
      }
    })
  }

  const handleReset = () => {
    setStep('input')
    setItems([])
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
      {step === 'input' && (
        <div className="flex flex-col">
          {/* Tab switcher */}
          <div className="flex border-b">
            <button
              onClick={() => setImportMode('text')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${importMode === 'text'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <FileText className="h-4 w-4" />
              Lista de Texto
            </button>
            <button
              onClick={() => setImportMode('ligamagic')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${importMode === 'ligamagic'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <Globe className="h-4 w-4" />
              Coleção Liga Magic
            </button>
          </div>

          {/* Text import */}
          {importMode === 'text' && (
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-dashed">
                <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Formato esperado (uma linha por card):</p>
                  <code className="text-xs bg-background px-2 py-1 rounded font-mono block mt-1">
                    &lt;quantidade&gt; &lt;nome do card&gt; [SET] #Nº &lt;condição&gt; &lt;idioma&gt; &lt;preço&gt;
                  </code>
                  <p className="text-muted-foreground mt-2">
                    <span className="font-medium">[SET]:</span> obrigatório (ex: [M25]) &nbsp;|&nbsp;
                    <span className="font-medium">#Nº:</span> opcional (ex: #169) &nbsp;|&nbsp;
                    <span className="font-medium">Condições:</span> NM, SP, MP, HP, D &nbsp;|&nbsp;
                    <span className="font-medium">Idiomas:</span> EN, PT, JP
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Linhas iniciando com <code className="bg-background px-1 rounded">#</code> ou <code className="bg-background px-1 rounded">//</code> são ignoradas.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Lista de Cards</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setTextInput(EXAMPLE_TEXT)}
                  >
                    Inserir exemplo
                  </Button>
                </div>
                <textarea
                  className="w-full min-h-[280px] rounded-lg border bg-background p-4 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                  placeholder={`# Exemplo:\n4 Lightning Bolt [M25] #169 NM EN 2.50\n2 Counterspell [TMP] SP PT 5.00\n1 Sol Ring [C21] MP EN 15.00`}
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  {textInput.split('\n').filter(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('//')).length} linha(s) detectadas
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={handleProcessText}
                  disabled={!textInput.trim() || isProcessing}
                  className="gap-2"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resolvendo Múltiplos Cards...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Processar Lista
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Liga Magic import */}
          {importMode === 'ligamagic' && (
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-dashed">
                <Globe className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Importar da Liga Magic</p>
                  <p className="text-muted-foreground">
                    Informe o ID da coleção da Liga Magic para importar automaticamente todos os cards.
                    O ID pode ser encontrado na URL da coleção: <code className="bg-background px-1 rounded text-xs">ligamagic.com.br/?view=colecao/colecao&id=<strong>123456</strong></code>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">ID da Coleção</label>
                <div className="flex gap-3">
                  <Input
                    placeholder="Ex: 475083"
                    value={ligamagicId}
                    onChange={e => setLigamagicId(e.target.value)}
                    className="max-w-xs font-mono"
                    onKeyDown={e => e.key === 'Enter' && handleProcessLigaMagic()}
                    autoFocus
                  />
                  <Button
                    onClick={handleProcessLigaMagic}
                    disabled={!ligamagicId.trim() || isProcessing}
                    className="gap-2"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importando Coleção...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4" />
                        Importar Coleção
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'preview' && (
        <div className="flex flex-col">
          {/* Summary bar */}
          <div className="p-4 md:p-6 border-b bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">{successItems.length} encontrado(s)</span>
              </div>
              {errorItems.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="font-medium">{errorItems.length} com erro</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Voltar e Editar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!successItems.length || isPending}
                size="sm"
                className="gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Adicionar {successItems.length} Card(s) ao Estoque
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="py-3 px-4 text-left font-medium">Status</th>
                  <th className="py-3 px-4 text-left font-medium">Card</th>
                  <th className="py-3 px-4 text-left font-medium">Edição</th>
                  <th className="py-3 px-4 text-center font-medium">Nº</th>
                  <th className="py-3 px-4 text-center font-medium">Qtd</th>
                  <th className="py-3 px-4 text-center font-medium">Condição</th>
                  <th className="py-3 px-4 text-center font-medium">Idioma</th>
                  <th className="py-3 px-4 text-center font-medium">Extras</th>
                  <th className="py-3 px-4 text-right font-medium">Preço (R$)</th>
                  <th className="py-3 px-4 text-center font-medium w-12"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={index}
                    className={`border-b transition-colors hover:bg-muted/30 ${item.status === 'error' ? 'bg-red-500/5' : ''}`}
                  >
                    <td className="py-3 px-4">
                      {item.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                          <span className="text-xs text-red-500 max-w-[120px] truncate" title={item.error}>{item.error}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.status === 'error' ? (
                        <div className="flex flex-col gap-1">
                          <Input
                            value={item.cardName}
                            onChange={e => handleUpdateItem(index, 'cardName', e.target.value)}
                            className="h-8 text-sm w-full font-medium"
                            placeholder="Nome do Card"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt={item.cardName}
                              className="w-8 h-11 object-cover rounded shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-11 bg-muted rounded shrink-0" />
                          )}
                          <span className="font-semibold truncate max-w-[200px]" title={item.cardName}>
                            {item.cardName}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <SetBadge setCode={item.setCode || ''} showText={false} />
                        <Input
                          value={item.setCode || ''}
                          onChange={e => handleUpdateItem(index, 'setCode', e.target.value.toUpperCase())}
                          className="w-20 h-8 text-xs font-mono uppercase"
                          placeholder="SET"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => handleReResolve(index)}
                          disabled={reResolvingIndex === index}
                          title="Re-buscar no Scryfall com este set"
                        >
                          {reResolvingIndex === index ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      {item.error && item.status === 'success' && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                          <span className="text-[10px] text-amber-500 truncate" title={item.error}>{item.error}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Input
                        type="text"
                        value={item.cardNumber || ''}
                        onChange={e => handleUpdateItem(index, 'cardNumber', e.target.value)}
                        className="w-16 text-center h-8 text-sm mx-auto font-mono"
                        placeholder="—"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={e => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-16 text-center h-8 text-sm mx-auto"
                        min={1}
                        disabled={item.status === 'error'}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Select
                        value={item.condition}
                        onValueChange={v => v && handleUpdateItem(index, 'condition', v)}
                        disabled={item.status === 'error'}
                      >
                        <SelectTrigger className="w-20 h-8 text-xs mx-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NM">NM</SelectItem>
                          <SelectItem value="SP">SP</SelectItem>
                          <SelectItem value="MP">MP</SelectItem>
                          <SelectItem value="HP">HP</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Select
                        value={item.language}
                        onValueChange={v => v && handleUpdateItem(index, 'language', v)}
                        disabled={item.status === 'error'}
                      >
                        <SelectTrigger className="w-20 h-8 text-xs mx-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EN">EN</SelectItem>
                          <SelectItem value="PT">PT</SelectItem>
                          <SelectItem value="JP">JP</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4">
                      <ChipListInput
                        values={item.extras || []}
                        onChange={(v) => handleUpdateItem(index, 'extras', v)}
                        suggestions={VALID_EXTRAS}
                        placeholder="Extras"
                        className="min-w-[120px]"
                        disabled={item.status === 'error'}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={e => handleUpdateItem(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-24 text-right h-8 text-sm ml-auto"
                        min={0}
                        disabled={item.status === 'error'}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <p>Todos os itens foram removidos.</p>
              <Button variant="outline" className="mt-4" onClick={handleReset}>
                Voltar e Editar
              </Button>
            </div>
          )}

          {/* Bottom action bar */}
          {items.length > 0 && (
            <div className="p-4 md:p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={handleReset}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!successItems.length || isPending}
                className="gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Confirmar Importação
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
