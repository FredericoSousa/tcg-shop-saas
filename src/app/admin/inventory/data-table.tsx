'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from '@tanstack/react-table'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PackageOpen } from 'lucide-react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const uniqueSets = React.useMemo(() => {
    const sets = new Set<string>()
    data.forEach((item: any) => {
      if (item.cardTemplate?.set) sets.add(item.cardTemplate.set)
    })
    return Array.from(sets).sort()
  }, [data])

  const uniqueConditions = React.useMemo(() => {
    const conditions = new Set<string>()
    data.forEach((item: any) => {
      if (item.condition) conditions.add(item.condition)
    })
    return Array.from(conditions).sort()
  }, [data])

  const uniqueLanguages = React.useMemo(() => {
    const langs = new Set<string>()
    data.forEach((item: any) => {
      if (item.language) langs.add(item.language)
    })
    return Array.from(langs).sort()
  }, [data])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 pb-4">
        <Input
          placeholder="Filtrar por nome..."
          value={(table.getColumn("cardTemplate_name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("cardTemplate_name")?.setFilterValue(event.target.value)
          }
          className="max-w-[200px]"
        />

        <Select
          value={(table.getColumn("cardTemplate_set")?.getFilterValue() as string) ?? "all"}
          onValueChange={(value) =>
            table.getColumn("cardTemplate_set")?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filtrar por Edição" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Edições</SelectItem>
            {uniqueSets.map(set => (
              <SelectItem key={set} value={set}>{set}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={(table.getColumn("condition")?.getFilterValue() as string) ?? "all"}
          onValueChange={(value) =>
            table.getColumn("condition")?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filtrar Condição" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Condições</SelectItem>
            {uniqueConditions.map(cond => (
              <SelectItem key={cond} value={cond}>{cond}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={(table.getColumn("language")?.getFilterValue() as string) ?? "all"}
          onValueChange={(value) =>
            table.getColumn("language")?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filtrar Idioma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Idiomas</SelectItem>
            {uniqueLanguages.map(lang => (
              <SelectItem key={lang} value={lang}>{lang}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border bg-white shadow-sm">
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
                )
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-48 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground space-y-3">
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                    <PackageOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">Nenhum card encontrado</p>
                    <p className="text-sm">Seu estoque está vazio ou a busca não retornou resultados.</p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-4 py-4 border-t border-muted/50">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-muted-foreground hidden sm:block">Linhas por página</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
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
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center text-sm font-medium text-muted-foreground mr-2">
            Página {table.getState().pagination.pageIndex + 1} de{' '}
            {table.getPageCount() || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próximo
          </Button>
        </div>
        </div>
      </div>
    </div>
  )
}
