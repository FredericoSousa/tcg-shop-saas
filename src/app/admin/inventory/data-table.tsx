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
  PaginationState,
} from "@tanstack/react-table";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  PackageOpen,
  Trash2,
  X,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { deleteInventoryItems } from "@/app/actions/inventory";
import { toast } from "sonner";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [isDeleting, setIsDeleting] = React.useState(false);

  const uniqueSets = React.useMemo(() => {
    const sets = new Set<string>();
    data.forEach((item: any) => {
      if (item.cardTemplate?.set) sets.add(item.cardTemplate.set);
    });
    return Array.from(sets).sort();
  }, [data]);

  const uniqueConditions = React.useMemo(() => {
    const conditions = new Set<string>();
    data.forEach((item: any) => {
      if (item.condition) conditions.add(item.condition);
    });
    return Array.from(conditions).sort();
  }, [data]);

  const uniqueLanguages = React.useMemo(() => {
    const langs = new Set<string>();
    data.forEach((item: any) => {
      if (item.language) langs.add(item.language);
    });
    return Array.from(langs).sort();
  }, [data]);

  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: searchParams ? Number(searchParams.get("page") || 1) - 1 : 0,
    pageSize: searchParams ? Number(searchParams.get("limit") || 10) : 10,
  });

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", (pageIndex + 1).toString());
    params.set("limit", pageSize.toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pageIndex, pageSize, pathname, router]);

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount,
    manualPagination: pageCount !== undefined,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination,
    },
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const hasActiveFilters =
    columnFilters.length > 0 ||
    (table.getColumn("cardTemplate_name")?.getFilterValue() as string);

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const ids = selectedRows.map((row) => (row.original as any).id);

    if (
      !confirm(
        `Tem certeza de que deseja excluir ${ids.length} item(ns) do estoque?`,
      )
    )
      return;

    setIsDeleting(true);
    try {
      await deleteInventoryItems(ids);
      toast.success(`${ids.length} item(ns) removido(s) com sucesso.`);
      setRowSelection({});
    } catch {
      toast.error("Erro ao excluir itens selecionados.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearFilters = () => {
    table.resetColumnFilters();
  };

  return (
    <div className="space-y-4 w-full">
      {/* Filters Section */}
      <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-border/50">
        <Input
          placeholder="Filtrar por nome..."
          value={
            (table
              .getColumn("cardTemplate_name")
              ?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table
              .getColumn("cardTemplate_name")
              ?.setFilterValue(event.target.value)
          }
          className="max-w-xs transition-all duration-200 focus-visible:ring-2"
          aria-label="Filtrar tabela por nome do card"
        />

        <Select
          value={
            (table.getColumn("cardTemplate_set")?.getFilterValue() as string) ??
            "all"
          }
          onValueChange={(value) =>
            table
              .getColumn("cardTemplate_set")
              ?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger
            className="w-44 transition-all duration-200 hover:border-primary/50"
            aria-label="Filtrar por edição"
          >
            <SelectValue placeholder="Filtrar por Edição" />
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
          value={
            (table.getColumn("condition")?.getFilterValue() as string) ?? "all"
          }
          onValueChange={(value) =>
            table
              .getColumn("condition")
              ?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger
            className="w-44 transition-all duration-200 hover:border-primary/50"
            aria-label="Filtrar por condição"
          >
            <SelectValue placeholder="Filtrar Condição" />
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
          value={
            (table.getColumn("language")?.getFilterValue() as string) ?? "all"
          }
          onValueChange={(value) =>
            table
              .getColumn("language")
              ?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger
            className="w-44 transition-all duration-200 hover:border-primary/50"
            aria-label="Filtrar por idioma"
          >
            <SelectValue placeholder="Filtrar Idioma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Idiomas</SelectItem>
            {uniqueLanguages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-10 text-muted-foreground hover:text-foreground transition-all duration-200"
            aria-label="Limpar todos os filtros"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/30 rounded-lg px-4 py-3 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-sm font-semibold text-primary">
            {selectedCount}{" "}
            {selectedCount === 1 ? "item selecionado" : "itens selecionados"}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="ml-auto transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Excluir Selecionados
              </>
            )}
          </Button>
        </div>
      )}

      <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/50 bg-muted/20 rounded-b-lg">
          <div className="flex items-center space-x-2 order-2 sm:order-1">
            <p className="text-sm font-medium text-muted-foreground">
              Linhas por página:
            </p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger
                className="h-9 w-16 transition-all duration-200 hover:border-primary/50"
                aria-label="Selecionar número de linhas por página"
              >
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-3 order-1 sm:order-2">
            <div className="text-xs sm:text-sm font-medium text-muted-foreground">
              Página{" "}
              <span className="font-bold text-foreground">
                {table.getState().pagination.pageIndex + 1}
              </span>{" "}
              de{" "}
              <span className="font-bold text-foreground">
                {table.getPageCount() || 1}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 h-9 px-3"
                aria-label="Página anterior"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 h-9 px-3"
                aria-label="Próxima página"
              >
                Próximo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
