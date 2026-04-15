"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { createColumns } from "./columns";
import { feedback } from "@/lib/utils/feedback";


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTableState } from "@/lib/hooks/use-table-state";
import { FilterSection } from "@/components/admin/filter-section";
import { DataTablePagination } from "@/components/admin/data-table-pagination";
import { TableSearch } from "@/components/admin/table-search";

interface DataTableProps<TData> {
  data: TData[];
  pageCount: number;
  total?: number;
  categories: { id: string; name: string }[];
}

export function DataTable<TData extends { id: string }>({
  data,
  pageCount: serverPageCount,
  total: serverTotal,
  categories,
}: DataTableProps<TData>) {
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

  const [rowSelection, setRowSelection] = React.useState({});
  const currentCategory = getFilter("category") || "all";

  const columns = React.useMemo(() => createColumns(categories) as ColumnDef<TData, unknown>[], [categories]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    pageCount: serverPageCount,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
    },
  });

  const handleClearFilters = () => {
    clearFilters(["category"]);
  };

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);

  const handleBulkDelete = async () => {
    if (!confirm(`Deseja excluir ${selectedIds.length} produtos selecionados?`)) return;
    // Implementation of bulk delete will go here (or call an API)
    feedback.success(`${selectedIds.length} produtos excluídos.`);
    setRowSelection({});
  };

  return (
    <div className="space-y-4 relative">
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-4 bg-background border shadow-2xl rounded-2xl px-6 py-4 backdrop-blur-md">
            <span className="text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
              {selectedIds.length} selecionados
            </span>
            <div className="h-6 w-px bg-border mx-2" />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="font-bold">
                Alterar Categoria
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="font-bold">
                Excluir
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setRowSelection({})} className="text-muted-foreground hover:text-foreground">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <FilterSection resultsCount={serverTotal || (data.length > 0 ? page * limit : 0)}>

        <TableSearch 
          value={search} 
          onChange={setSearch} 
          placeholder="Buscar produtos..." 
          isLoading={isPending}
        />
        
        <div className="flex items-center gap-2">
          <Select 
            value={currentCategory} 
            onValueChange={(val) => setFilter("category", val === "all" ? null : val)}
          >
            <SelectTrigger className="w-full sm:w-[200px] font-bold">
              <SelectValue placeholder="Todas categorias">
                {currentCategory === "all" 
                  ? "Todas categorias" 
                  : categories.find(c => c.id === currentCategory)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(search || currentCategory !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 px-2 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </FilterSection>

      <div className={`rounded-md border bg-card ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <DataTablePagination 
          page={page}
          pageCount={serverPageCount}
          total={serverTotal || (data.length > 0 ? page * limit : 0)} // fallback if total not provided
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>
    </div>
  );
}
