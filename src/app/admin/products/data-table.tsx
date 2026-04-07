"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { createColumns } from "./columns";

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

  const currentCategory = getFilter("category") || "all";

  const columns = React.useMemo(() => createColumns(categories) as ColumnDef<TData, unknown>[], [categories]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    pageCount: serverPageCount,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
    },
  });

  const handleClearFilters = () => {
    clearFilters(["category"]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <TableSearch 
          value={search} 
          onChange={setSearch} 
          placeholder="Buscar produtos..." 
          isLoading={isPending}
        />
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
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
      </div>

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
