"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PackageOpen,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTableState } from "@/lib/hooks/use-table-state";
import { DataTablePagination } from "@/components/admin/data-table-pagination";
import { TableSearch } from "@/components/admin/table-search";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
  total?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount: serverPageCount,
  total: serverTotal,
}: DataTableProps<TData, TValue>) {
  const {
    page,
    limit,
    search,
    getFilter,
    setPage,
    setLimit,
    setSearch,
    setFilter,
    clearFilters,
    isPending,
  } = useTableState();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // Sync TanStack column filters with URL
  const columnFilters = React.useMemo(() => {
    const filters: ColumnFiltersState = [];
    // We can iterate over common filter keys or just use the hook's getFilter
    // In this specific table, we have set, condition, language, extras
    ["cardTemplate_set", "condition", "language", "extras"].forEach(key => {
      const val = getFilter(key);
      if (val) filters.push({ id: key, value: val });
    });
    return filters;
  }, [getFilter]);

  const uniqueSets = React.useMemo(() => {
    const sets = new Set<string>();
    data.forEach((item: TData) => {
      const i = item as { cardTemplate?: { set?: string } };
      if (i.cardTemplate?.set) sets.add(i.cardTemplate.set);
    });
    return Array.from(sets).sort();
  }, [data]);

  const uniqueConditions = React.useMemo(() => {
    const conditions = new Set<string>();
    data.forEach((item: TData) => {
      const i = item as { condition?: string };
      if (i.condition) conditions.add(i.condition);
    });
    return Array.from(conditions).sort();
  }, [data]);

  const uniqueLanguages = React.useMemo(() => {
    const langs = new Set<string>();
    data.forEach((item: TData) => {
      const i = item as { language?: string };
      if (i.language) langs.add(i.language);
    });
    return Array.from(langs).sort();
  }, [data]);

  const uniqueExtras = React.useMemo(() => {
    const extras = new Set<string>();
    data.forEach((item: TData) => {
      const i = item as { extras?: string[] };
      if (i.extras) i.extras.forEach((e) => extras.add(e));
    });
    return Array.from(extras).sort();
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    pageCount: serverPageCount,
    manualPagination: serverPageCount !== undefined,
    manualFiltering: true, // Filters are handled via URL/Hook
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
    },
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const hasActiveFilters = columnFilters.length > 0 || search;

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const ids = selectedRows.map((row) => (row.original as { id: string }).id);

    setIsDeleting(true);
    try {
      const response = await fetch("/api/inventory/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success(`${ids.length} item(ns) removido(s) com sucesso.`);
      setRowSelection({});
      setIsDeleteDialogOpen(false);
    } catch {
      toast.error("Erro ao excluir itens selecionados.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearFilters = () => {
    clearFilters(["cardTemplate_set", "condition", "language", "extras"]);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Filters Section */}
      <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-border/50">
        <TableSearch 
          value={search} 
          onChange={setSearch} 
          placeholder="Buscar por nome..." 
          isLoading={isPending}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={getFilter("cardTemplate_set") || "all"}
            onValueChange={(value) => setFilter("cardTemplate_set", value === "all" ? null : value)}
          >
            <SelectTrigger
              className="w-[140px] h-9 text-xs transition-all duration-200 hover:border-primary/50"
              aria-label="Filtrar por edição"
            >
              <SelectValue placeholder="Edição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Edições</SelectItem>
              {uniqueSets.map((set) => (
                <SelectItem key={set} value={set}>
                  {set}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={getFilter("condition") || "all"}
            onValueChange={(value) => setFilter("condition", value === "all" ? null : value)}
          >
            <SelectTrigger
              className="w-[130px] h-9 text-xs transition-all duration-200 hover:border-primary/50"
              aria-label="Filtrar por condição"
            >
              <SelectValue placeholder="Condição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Condições</SelectItem>
              {uniqueConditions.map((cond) => (
                <SelectItem key={cond} value={cond}>
                  {cond}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={getFilter("language") || "all"}
            onValueChange={(value) => setFilter("language", value === "all" ? null : value)}
          >
            <SelectTrigger
              className="w-[110px] h-9 text-xs transition-all duration-200 hover:border-primary/50"
              aria-label="Filtrar por idioma"
            >
              <SelectValue placeholder="Idioma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Idiomas</SelectItem>
              {uniqueLanguages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={getFilter("extras") || "all"}
            onValueChange={(value) => setFilter("extras", value === "all" ? null : value)}
          >
            <SelectTrigger
              className="w-[120px] h-9 text-xs transition-all duration-200 hover:border-primary/50"
              aria-label="Filtrar por extras"
            >
              <SelectValue placeholder="Extras" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Extras</SelectItem>
              {uniqueExtras.map((extra) => (
                <SelectItem key={extra} value={extra}>
                  {extra}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 px-2 text-muted-foreground hover:text-destructive transition-all duration-200 text-xs"
              aria-label="Limpar todos os filtros"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/30 rounded-lg px-4 py-3 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-sm font-semibold text-primary">
            {selectedCount}{" "}
            {selectedCount === 1 ? "item selecionado" : "itens selecionados"}
          </span>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  className="ml-auto transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 gap-2"
                />
              }
            >
              <Trash2 className="h-4 w-4" />
              Excluir Selecionados
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogDescription>
                  Tem certeza de que deseja excluir {selectedCount} {selectedCount === 1 ? "item" : "itens"} do estoque? Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4 gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeleting} className="gap-2">
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    "Confirmar Exclusão"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className={`rounded-lg border bg-card shadow-sm overflow-x-auto ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
        <Table
          role="table"
          aria-label="Tabela de inventário com opções de ordenação e filtro"
        >
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      scope="col"
                      className="font-semibold text-foreground text-left py-3 px-4"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, idx) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50 transition-colors focus-within:bg-muted/60 focus-within:outline-none border-b last:border-b-0"
                  role="row"
                  tabIndex={0}
                  aria-rowindex={idx + 2}
                >
                  {row.getVisibleCells().map((cell, cellIdx) => (
                    <TableCell
                      key={cell.id}
                      className="py-3 px-4 transition-colors"
                      role="gridcell"
                      tabIndex={cellIdx === 0 ? 0 : -1}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-muted-foreground space-y-3 animate-in fade-in duration-500">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <PackageOpen className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        Nenhum card encontrado
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Seu estoque está vazio ou a busca não retornou
                        resultados.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        <DataTablePagination 
          page={page}
          pageCount={serverPageCount || table.getPageCount() || 1}
          total={serverTotal || data.length}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>
    </div>
  );
}
