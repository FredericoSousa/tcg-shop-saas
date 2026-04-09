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
import { FilterSection } from "@/components/admin/filter-section";
import { DataTablePagination } from "@/components/admin/data-table-pagination";
import { TableSearch } from "@/components/admin/table-search";
import { BulkActionsBar } from "@/components/admin/inventory/bulk-actions-bar";

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

  const handleBulkDelete = () => {
    // This is now handled by the BulkActionsBar component
    // We just need to refresh the table data and clear selection
    setRowSelection({});
    // router.refresh() or similar could be better but Tanstack table handles its own state
    // The parent component (InventoryPage) fetches data. 
    // We can rely on router.refresh() via window.location.reload() or a more reach-friendly way.
    window.location.reload(); 
  };

  const handleClearFilters = () => {
    clearFilters(["cardTemplate_set", "condition", "language", "extras"]);
  };

  return (
    <div className="space-y-4 w-full">
      <FilterSection resultsCount={serverTotal || data.length}>
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
              className="w-full sm:w-[150px] font-bold"
              aria-label="Filtrar por edição"
            >
              <SelectValue placeholder="Edição">
                {getFilter("cardTemplate_set") || "Todas Edições"}
              </SelectValue>
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
              className="w-full sm:w-[150px] font-bold"
              aria-label="Filtrar por condição"
            >
              <SelectValue placeholder="Condição">
                {getFilter("condition") || "Todas Condições"}
              </SelectValue>
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
              className="w-full sm:w-[120px] font-bold"
              aria-label="Filtrar por idioma"
            >
              <SelectValue placeholder="Idioma">
                {getFilter("language") || "Idiomas"}
              </SelectValue>
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
              className="w-full sm:w-[150px] font-bold"
              aria-label="Filtrar por extras"
            >
              <SelectValue placeholder="Extras">
                {getFilter("extras") || "Todos Extras"}
              </SelectValue>
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
      </FilterSection>

      {selectedCount > 0 && (
        <BulkActionsBar
          selectedCount={selectedCount}
          selectedIds={table.getFilteredSelectedRowModel().rows.map(row => (row.original as { id: string }).id)}
          onClearSelection={() => setRowSelection({})}
          onActionComplete={() => {
            setRowSelection({});
            window.location.reload();
          }}
        />
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
