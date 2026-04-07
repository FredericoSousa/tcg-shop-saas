"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
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
import { Input } from "@/components/ui/input";
import * as React from "react";
import { useTransition } from "react";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTableProps<TData, TValue = unknown> {
  data: TData[];
  pageCount: number;
  categories: { id: string; name: string }[];
}

export function DataTable<TData extends { id: string }, TValue = unknown>({
  data,
  pageCount,
  categories,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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

  const columns = React.useMemo(() => createColumns(categories) as ColumnDef<TData, any>[], [categories]);

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
  });

  const search = searchParams.get("search") || "";
  const currentCategory = searchParams.get("category") || "all";

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", term);
    params.set("page", "1");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleCategoryChange = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            defaultValue={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={currentCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
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
              onClick={() => {
                router.push(pathname);
              }}
              className="h-9 px-2 text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>
      <div className="rounded-md border bg-card">
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
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPagination((prev: PaginationState) => ({ ...prev, pageIndex: prev.pageIndex - 1 }));
          }}
          disabled={pageIndex <= 0 || isPending}
        >
          Anterior
        </Button>
        <div className="text-sm font-medium">
          Página {pageIndex + 1} de {pageCount}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPagination((prev: PaginationState) => ({ ...prev, pageIndex: prev.pageIndex + 1 }));
          }}
          disabled={pageIndex + 1 >= pageCount || isPending}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}
