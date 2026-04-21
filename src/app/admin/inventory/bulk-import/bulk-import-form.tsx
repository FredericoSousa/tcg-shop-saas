"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Trash2,
  CheckCircle2,
  XCircle,
  Upload,
  FileText,
  ArrowRight,
  Globe,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import type { BulkItemResult } from "@/lib/types/inventory";
import type { ImportProgress } from "@/lib/scrapers/liga-magic-scraper";
import { feedback } from "@/lib/utils/feedback";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SetBadge } from "@/components/ui/set-badge";
import { ChipListInput } from "@/components/ui/chip-list-input";
import { ImportProgressDisplay } from "@/components/admin/import-progress-display";
import { ScryfallService } from "@/lib/api/services/scryfall.service";
import { InventoryService, BulkInventoryItemDto } from "@/lib/api/services/inventory.service";
import { MTGCardTitle } from "@/components/ui/mtg-card-title";


type ParsedLine = {
  quantity: number;
  cardName: string;
  setCode: string;
  cardNumber?: string;
  condition: string;
  language: string;
  price: number;
  extras: string[];
  raw: string;
};

const VALID_CONDITIONS = ["NM", "SP", "MP", "HP", "D"];
const VALID_LANGUAGES = ["EN", "PT", "JP"];
const VALID_EXTRAS = [
  "FOIL",
  "PROMO",
  "PRE_RELEASE",
  "FNM",
  "DCI",
  "TEXTLESS",
  "SIGNED",
  "OVERSIZED",
  "ALTERED",
  "FOIL_ETCHED",
  "MISPRINT",
  "MISCUT",
];

const EXAMPLE_TEXT = `4 Lightning Bolt [M25] #169 NM EN 2.50
2 Counterspell [TMP] SP PT 5.00
1 Black Lotus [LEA] #232 NM EN 25000.00
3 Sol Ring [C21] MP EN 15.00`;

function parseLine(line: string): ParsedLine | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//"))
    return null;

  // Format: <qty> <card name> [SET] <condition> <language> <price>
  // [SET] is optional, e.g. [M25], (LEA), M25
  // Price is the last token, language second-to-last, condition third-to-last
  const tokens = trimmed.split(/\s+/);
  if (tokens.length < 5) return null;

  const quantity = parseInt(tokens[0], 10);
  if (isNaN(quantity) || quantity < 1) return null;

  const price = parseFloat(tokens[tokens.length - 1].replace(",", "."));
  if (isNaN(price) || price < 0) return null;

  const language = tokens[tokens.length - 2].toUpperCase();
  const condition = tokens[tokens.length - 3].toUpperCase();

  if (!VALID_CONDITIONS.includes(condition)) return null;
  if (!VALID_LANGUAGES.includes(language)) return null;

  const nameTokens = tokens.slice(1, tokens.length - 3);

  let setCode: string | undefined;
  let cardNumber: string | undefined;

  // Extract optional #NUMBER
  const numTokenIndex = nameTokens.findIndex((t) => /^#\d+$/.test(t));
  if (numTokenIndex !== -1) {
    cardNumber = nameTokens[numTokenIndex].replace("#", "");
    nameTokens.splice(numTokenIndex, 1);
  }

  // Extract optional [SET] or (SET)
  const setTokenIndex = nameTokens.findIndex(
    (t) => /^\[.+\]$/.test(t) || /^\(.+\)$/.test(t),
  );
  if (setTokenIndex !== -1) {
    setCode = nameTokens[setTokenIndex]
      .replace(/[\[\]\(\)]/g, "")
      .toUpperCase();
    nameTokens.splice(setTokenIndex, 1);
  }

  const extras: string[] = [];
  while (
    nameTokens.length > 0 &&
    VALID_EXTRAS.includes(nameTokens[nameTokens.length - 1].toUpperCase())
  ) {
    extras.unshift(nameTokens.pop()!.toUpperCase());
  }

  const cardName = nameTokens.join(" ");
  if (!cardName) return null;

  return {
    quantity,
    cardName,
    setCode: setCode || "",
    cardNumber,
    condition,
    language,
    price,
    extras,
    raw: trimmed,
  };
}

type ImportMode = "text" | "ligamagic";

export function BulkImportForm() {
  const [importMode, setImportMode] = useState<ImportMode>("text");
  const [textInput, setTextInput] = useState("");
  const [ligamagicId, setLigamagicId] = useState("");
  const [step, setStep] = useState<"input" | "preview">("input");
  const [items, setItems] = useState<
    (BulkItemResult & { originalLine: string })[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setProcessProgress] = useState({
    current: 0,
    total: 0,
  });
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(
    null,
  );
  const [isStreamingProgress, setIsStreamingProgress] = useState(false);
  const [isPending, startTransition] = useTransition();

  // === Helper: Merge duplicate cards by key ===
  const mergeDuplicateCards = (cards: ParsedLine[]): ParsedLine[] => {
    const merged = cards.reduce(
      (acc, curr) => {
        const key = `${curr.cardName.toLowerCase()}|${curr.setCode}|${curr.cardNumber || ""}|${curr.condition}|${curr.language}|${curr.price}|${curr.extras.join(",")}`;
        if (acc[key]) {
          acc[key].quantity += curr.quantity;
        } else {
          acc[key] = { ...curr };
        }
        return acc;
      },
      {} as Record<string, ParsedLine>,
    );
    return Object.values(merged);
  };

  // === Helper: Process cards in batches ===
  const processCarsInBatches = async (
    batchRequest: Array<{
      cardName: string;
      setCode?: string;
      cardNumber?: string;
      quantity: number;
      condition: string;
      language: string;
      price: number;
      extras: string[];
      originalLine: string;
    }>,
  ) => {
    const CHUNK_SIZE = 75;
    let results: (BulkItemResult & { originalLine: string })[] = [];
    for (let i = 0; i < batchRequest.length; i += CHUNK_SIZE) {
      const chunk = batchRequest.slice(i, i + CHUNK_SIZE);
      const apiResponse = await ScryfallService.resolveBatch(chunk);
      if (!apiResponse.success) throw new Error(apiResponse.message || "Erro na resolução em lote");

      const chunkResults = apiResponse.data || [];
      results = results.concat(chunkResults);
      setProcessProgress({
        current: Math.min(i + CHUNK_SIZE, batchRequest.length),
        total: batchRequest.length,
      });
    }
    return results;
  };

  // === Text import handler ===
  const handleProcessText = async () => {
    const lines = textInput.split("\n").filter((l) => l.trim());
    const parsed: ParsedLine[] = [];
    const errors: string[] = [];

    lines.forEach((line, i) => {
      const result = parseLine(line);
      if (result) {
        parsed.push(result);
      } else if (
        line.trim() &&
        !line.trim().startsWith("#") &&
        !line.trim().startsWith("//")
      ) {
        errors.push(`Linha ${i + 1}: formato inválido — "${line.trim()}"`);
      }
    });

    if (errors.length) {
      feedback.error(`${errors.length} linha(s) com erro de formato`, errors.slice(0, 3).join("\n"));
    }

    if (!parsed.length) {
      feedback.error("Nenhuma linha válida encontrada.");
      return;
    }

    setIsProcessing(true);
    setProcessProgress({ current: 0, total: parsed.length });

    try {
      const mergedParsed = mergeDuplicateCards(parsed);

      const batchRequest = mergedParsed.map((p) => ({
        cardName: p.cardName,
        setCode: p.setCode || undefined,
        cardNumber: p.cardNumber,
        quantity: p.quantity,
        condition: p.condition,
        language: p.language,
        price: p.price,
        extras: p.extras,
        originalLine: p.raw,
      }));

      const results = await processCarsInBatches(batchRequest);
      setItems(results);
      setStep("preview");
    } catch (error) {
      feedback.apiError(error, "Erro ao processar lista");
    } finally {
      setIsProcessing(false);
    }
  };

  // === Liga Magic import handler with SSE streaming ===
  const handleProcessLigaMagic = async () => {
    if (!ligamagicId.trim()) {
      feedback.error("Informe o ID da coleção da Liga Magic.");
      return;
    }

    setIsProcessing(true);
    setIsStreamingProgress(true);
    setImportProgress(null);
    setProcessProgress({ current: 0, total: 0 });

    try {
      // Use SSE to stream progress updates in real-time
      const eventSource = new EventSource(
        `/api/import-collection-stream?id=${encodeURIComponent(ligamagicId)}`,
      );

      let hasError = false;

      eventSource.onmessage = (event) => {
        try {
          const progress: ImportProgress = JSON.parse(event.data);
          setImportProgress(progress);

          if (progress.status === "completed" && !hasError) {
            eventSource.close();
            // After streaming is done, fetch the actual collection data
            setTimeout(async () => {
              try {
                const apiResponse = await InventoryService.importLigaMagic(ligamagicId);
                if (!apiResponse.success) {
                  throw new Error(apiResponse.message || "Erro ao importar coleção");
                }

                const cards: (BulkItemResult & { originalLine: string })[] = apiResponse.data || [];

                if (!cards || cards.length === 0) {
                  feedback.error("Nenhum card encontrado na coleção.");
                  setIsStreamingProgress(false);
                  return;
                }

                setProcessProgress({ current: 0, total: cards.length });

                const batchRequest = cards.map((card: BulkItemResult & { originalLine: string }) => ({
                  cardName: card.cardName,
                  setCode: card.setCode || undefined,
                  cardNumber: card.cardNumber,
                  quantity: card.quantity,
                  condition: card.condition,
                  language: card.language,
                  price: card.price,
                  extras: card.extras || [],
                  originalLine: card.originalLine,
                }));

                const results = await processCarsInBatches(batchRequest);
                setItems(results);
                setStep("preview");
              } catch (error) {
                feedback.apiError(error, "Erro ao importar coleção");
              } finally {
                setIsStreamingProgress(false);
              }
            }, 500);
          } else if (progress.status === "error") {
            hasError = true;
            eventSource.close();
            feedback.error("Erro ao importar coleção. Tente novamente.");
            setIsStreamingProgress(false);
          }
        } catch (e) {
          console.error("Error parsing progress:", e);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        feedback.error("Conexão perdida durante a importação.");
        setIsStreamingProgress(false);
      };
    } catch (error) {
      feedback.apiError(error, "Erro ao importar coleção");
      setIsStreamingProgress(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: string,
    value: string | number | string[],
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return { ...item, [field]: value };
      }),
    );
  };

  const [reResolvingIndex, setReResolvingIndex] = useState<number | null>(null);

  const handleReResolve = async (index: number) => {
    const item = items[index];
    if (!item) return;

    setReResolvingIndex(index);
    try {
      // Use the normal search API directly for re-processing since it supports fuzzy matching via the text search API
      const result = await ScryfallService.searchByName(item.cardName, item.setCode, item.cardNumber);
      const found = result.data;

      if (found && found.status === "success") {
        const resultItem = {
          ...item,
          ...found,
          quantity: item.quantity,
          condition: item.condition,
          language: item.language,
          price: item.price,
          status: "success" as const,
        };

        setItems((prev) =>
          prev.map((it, i) => {
            if (i !== index) return it;
            return resultItem as BulkItemResult & { originalLine: string };
          }),
        );
      } else {
        setItems((prev) =>
          prev.map((it, i) => {
            if (i !== index) return it;
            return {
              ...it,
              status: "error" as const,
              error: `Não encontrado com nome "${it.cardName}" e set "${it.setCode || "(vazio)"}"`,
              scryfallId: undefined,
              imageUrl: undefined,
            };
          }),
        );
      }
    } catch (error) {
      feedback.apiError(error, "Erro ao buscar no Scryfall");
    } finally {
      setReResolvingIndex(null);
    }
  };

  const successItems = items.filter(
    (i) => i.status === "success" && i.scryfallId,
  );
  const errorItems = items.filter((i) => i.status === "error");

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        const toAdd = successItems.map((item) => ({
          scryfallId: item.scryfallId!,
          quantity: item.quantity,
          condition: item.condition as "NM" | "SP" | "MP" | "HP" | "D",
          language: item.language as "EN" | "PT" | "JP",
          price: item.price,
          extras: item.extras || [],
        }));

        if (!toAdd.length) {
          feedback.error("Nenhum card com sucesso para adicionar.");
          return;
        }

        const CHUNK_SIZE = 50;
        let totalSuccesses = 0;
        let totalErrors = 0;

        for (let i = 0; i < toAdd.length; i += CHUNK_SIZE) {
          const chunk = toAdd.slice(i, i + CHUNK_SIZE);
          const apiResponse = await InventoryService.bulkAdd(chunk as BulkInventoryItemDto[]);
          if (!apiResponse.success) {
            throw new Error(apiResponse.message || "Erro ao salvar lote");
          }

          const results = apiResponse.data || [];

          totalSuccesses += results.filter(
            (r) => r.status === "success",
          ).length;
          totalErrors += results.filter((r) => r.status === "error").length;
        }

        if (totalSuccesses > 0) {
          feedback.success(
            `✓ ${totalSuccesses} card(s) adicionado(s) ao estoque!`,
          );
        }
        if (totalErrors > 0) {
          feedback.error(`✗ ${totalErrors} card(s) falharam ao salvar.`);
        }

        setTextInput("");
        setLigamagicId("");
        handleReset();
      } catch (error) {
        feedback.apiError(error, "Erro ao salvar");
      }
    });
  };

  const handleReset = () => {
    setStep("input");
    setItems([]);
    setImportProgress(null);
    setIsStreamingProgress(false);
    setProcessProgress({ current: 0, total: 0 });
    setImportMode("text");
  };

  // Ensure state is 100% clean if restored by Next.js router cache
  useEffect(() => {
    handleReset();
    setTextInput("");
    setLigamagicId("");

  }, []);

  return (
    <div className="bg-card rounded-xl shadow-lg border overflow-hidden">
      {step === "input" && (
        <div className="flex flex-col">
          {/* Enhanced Tab switcher */}
          <div className="flex border-b bg-muted/30 p-1">
            <button
              onClick={() => setImportMode("text")}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 px-6 py-3.5 text-sm font-semibold transition-all rounded-lg mx-1 ${importMode === "text"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Lista de Texto</span>
              <span className="sm:hidden">Texto</span>
            </button>
            <button
              onClick={() => setImportMode("ligamagic")}
              className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 px-6 py-3.5 text-sm font-semibold transition-all rounded-lg mx-1 ${importMode === "ligamagic"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">LigaMagic</span>
              <span className="sm:hidden">LM</span>
            </button>
          </div>

          {/* Text import */}
          {importMode === "text" && (
            <div className="p-6 md:p-8 flex flex-col gap-6">
              {/* Info box with better styling */}
              <div className="flex gap-4 p-4 md:p-5 bg-info-muted border border-info/20 rounded-xl">
                <FileText className="h-6 w-6 text-info shrink-0 mt-0.5" />
                <div className="text-sm space-y-2">
                  <p className="font-semibold text-info">
                    Formato esperado (uma linha por card):
                  </p>
                  <code className="text-xs bg-background px-3 py-2 rounded-lg font-mono block border border-info/20">
                    &lt;quantidade&gt; &lt;nome do card&gt; [SET] #Nº
                    &lt;condição&gt; &lt;idioma&gt; &lt;preço&gt;
                  </code>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-info">
                    <div>
                      <span className="font-semibold">[SET]:</span> obrigatório
                      (ex: [M25])
                    </div>
                    <div>
                      <span className="font-semibold">#Nº:</span> opcional (ex:
                      #169)
                    </div>
                    <div>
                      <span className="font-semibold">Condições:</span> NM, SP,
                      MP, HP, D
                    </div>
                    <div>
                      <span className="font-semibold">Idiomas:</span> EN, PT, JP
                    </div>
                  </div>
                  <p className="text-xs text-info">
                    Linhas iniciando com{" "}
                    <code className="bg-background px-1 rounded">
                      #
                    </code>{" "}
                    ou{" "}
                    <code className="bg-background px-1 rounded">
                      {"//"}
                    </code>{" "}
                    são ignoradas.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">
                    Lista de Cards
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setTextInput(EXAMPLE_TEXT)}
                  >
                    📋 Inserir exemplo
                  </Button>
                </div>
                <textarea
                  className="w-full min-h-[320px] rounded-xl border bg-background p-4 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                  placeholder={`# Exemplo:\n4 Lightning Bolt [M25] #169 NM EN 2.50\n2 Counterspell [TMP] SP PT 5.00\n1 Sol Ring [C21] MP EN 15.00`}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary"></span>
                  {
                    textInput
                      .split("\n")
                      .filter(
                        (l) =>
                          l.trim() &&
                          !l.trim().startsWith("#") &&
                          !l.trim().startsWith("//"),
                      ).length
                  }{" "}
                  linha(s) detectada(s)
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  onClick={handleProcessText}
                  disabled={!textInput.trim() || isProcessing}
                  className="gap-2"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resolvendo...
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
          {importMode === "ligamagic" && (
            <div className="p-6 md:p-8 flex flex-col gap-6">
              {/* Progress Display */}
              {(isStreamingProgress || importProgress) && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <ImportProgressDisplay
                    progress={importProgress}
                    isImporting={isStreamingProgress}
                    title="Importando coleção LigaMagic..."
                  />
                </div>
              )}

              {/* Info box */}
              <div className="flex gap-4 p-4 md:p-5 bg-purple-50 border border-purple-200 rounded-xl">
                <Globe className="h-6 w-6 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-sm space-y-2">
                  <p className="font-semibold text-purple-900">
                    Importar da Liga Magic
                  </p>
                  <p className="text-purple-800">
                    Informe o ID da coleção para importar automaticamente todos
                    os cards.
                  </p>
                  <p className="text-xs text-purple-700">
                    O ID pode ser encontrado na URL:{" "}
                    <code className="bg-background px-2 py-1 rounded font-mono">
                      ligamagic.com.br/?view=colecao/colecao&id=
                      <strong>123456</strong>
                    </code>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold">ID da Coleção</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Ex: 123456"
                    value={ligamagicId}
                    onChange={(e) => setLigamagicId(e.target.value)}
                    className="font-mono text-sm"
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleProcessLigaMagic()
                    }
                    autoFocus
                    disabled={isStreamingProgress}
                  />
                  <Button
                    onClick={handleProcessLigaMagic}
                    disabled={
                      !ligamagicId.trim() || isProcessing || isStreamingProgress
                    }
                    className="gap-2 whitespace-nowrap"
                    size="lg"
                  >
                    {isProcessing || isStreamingProgress ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">Importando...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4" />
                        Importar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === "preview" && (
        <div className="flex flex-col">
          {/* Summary bar */}
          <div className="p-4 md:p-6 border-b bg-gradient-to-r from-muted/50 to-muted/30 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3 text-sm font-semibold">
                <div className="flex items-center justify-center h-8 w-8 bg-success-muted rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Encontrados</p>
                  <p className="text-lg font-bold text-success">
                    {successItems.length}
                  </p>
                </div>
              </div>
              {errorItems.length > 0 && (
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <div className="flex items-center justify-center h-8 w-8 bg-destructive-muted rounded-lg">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Com erro</p>
                    <p className="text-lg font-bold text-destructive">
                      {errorItems.length}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex-1 sm:flex-none"
              >
                ← Voltar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!successItems.length || isPending}
                size="sm"
                className="gap-2 flex-1 sm:flex-none"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Salvando...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span className="hidden md:inline">
                      Adicionar {successItems.length} Card(s)
                    </span>
                    <span className="md:hidden">
                      {successItems.length} Cards
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-3 px-4 text-left font-semibold text-muted-foreground uppercase text-xs tracking-wide">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left font-semibold text-muted-foreground uppercase text-xs tracking-wide">
                    Card
                  </th>
                  <th className="py-3 px-4 text-left font-semibold text-muted-foreground uppercase text-xs tracking-wide">
                    Edição
                  </th>
                  <th className="py-3 px-4 text-center font-semibold text-muted-foreground uppercase text-xs tracking-wide">
                    Nº
                  </th>
                  <th className="py-3 px-4 text-center font-semibold text-muted-foreground uppercase text-xs tracking-wide">
                    Qtd
                  </th>
                  <th className="py-3 px-4 text-center font-semibold text-muted-foreground uppercase text-xs tracking-wide">
                    Condição
                  </th>
                  <th className="py-3 px-4 text-center font-semibold text-muted-foreground uppercase text-xs tracking-wide">
                    Idioma
                  </th>
                  <th className="py-3 px-4 text-center font-semibold text-muted-foreground uppercase text-xs tracking-wide">
                    Extras
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-muted-foreground uppercase text-xs tracking-wide">
                    Preço
                  </th>
                  <th className="py-3 px-4 text-center font-semibold text-muted-foreground uppercase text-xs tracking-wide w-12"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={index}
                    className={`border-b transition-colors hover:bg-muted/50 ${item.status === "error"
                      ? "bg-destructive-muted/50"
                      : "bg-background"
                      }`}
                  >
                    <td className="py-3 px-4">
                      {item.status === "success" ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-destructive shrink-0" />
                          <span
                            className="text-xs text-destructive max-w-[120px] truncate"
                            title={item.error}
                          >
                            {item.error}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.status === "error" ? (
                        <div className="flex flex-col gap-1">
                          <Input
                            value={item.cardName}
                            onChange={(e) =>
                              handleUpdateItem(
                                index,
                                "cardName",
                                e.target.value,
                              )
                            }
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
                          <MTGCardTitle name={item.cardName} className="max-w-[200px]" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <SetBadge
                          setCode={item.setCode || ""}
                          showText={false}
                        />
                        <Input
                          value={item.setCode || ""}
                          onChange={(e) =>
                            handleUpdateItem(
                              index,
                              "setCode",
                              e.target.value.toUpperCase(),
                            )
                          }
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
                      {item.error && item.status === "success" && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
                          <span
                            className="text-2xs text-warning truncate"
                            title={item.error}
                          >
                            {item.error}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Input
                        type="text"
                        value={item.cardNumber || ""}
                        onChange={(e) =>
                          handleUpdateItem(index, "cardNumber", e.target.value)
                        }
                        className="w-16 text-center h-8 text-sm mx-auto font-mono"
                        placeholder="—"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="w-16 text-center h-8 text-sm mx-auto"
                        min={1}
                        disabled={item.status === "error"}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Select
                        value={item.condition}
                        onValueChange={(v) =>
                          v && handleUpdateItem(index, "condition", v)
                        }
                        disabled={item.status === "error"}
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
                        onValueChange={(v) =>
                          v && handleUpdateItem(index, "language", v)
                        }
                        disabled={item.status === "error"}
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
                        onChange={(v) => handleUpdateItem(index, "extras", v)}
                        suggestions={VALID_EXTRAS}
                        placeholder="Extras"
                        className="min-w-[120px]"
                        disabled={item.status === "error"}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) =>
                          handleUpdateItem(
                            index,
                            "price",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-24 text-right h-8 text-sm ml-auto"
                        min={0}
                        disabled={item.status === "error"}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
  );
}
