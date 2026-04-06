'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'
import { SetBadge } from '@/components/ui/set-badge'

export type InventoryRow = {
  id: string
  price: number
  quantity: number
  condition: string
  language: string
  cardTemplate: {
    name: string
    set: string
    imageUrl: string | null
    metadata?: Record<string, unknown> | null
  }
}

export const columns: ColumnDef<InventoryRow>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
        checked={table.getIsAllRowsSelected()}
        ref={(input) => {
          if (input) input.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
        }}
        onChange={(e) => table.toggleAllRowsSelected(!!e.target.checked)}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(!!e.target.checked)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'cardTemplate.name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="-ml-4 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Card
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const template = row.original.cardTemplate
      return (
        <div className="flex items-center gap-3">
          {template.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={template.imageUrl} alt={template.name} className="w-10 h-14 object-cover rounded shrink-0" />
          ) : (
            <div className="w-10 h-14 bg-muted rounded shrink-0" />
          )}
          <span className="font-semibold truncate max-w-[200px]" title={template.name}>{template.name}</span>
        </div>
      )
    }
  },
  {
    accessorKey: 'cardTemplate.set',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="-ml-4 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Edição
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const meta = row.original.cardTemplate.metadata as Record<string, unknown> | undefined
      const setName = (meta?.set_name as string) || row.original.cardTemplate.set
      return (
        <Badge variant="outline" className="gap-0 cursor-default p-0 px-2" title={setName}>
          <SetBadge setCode={row.original.cardTemplate.set} />
        </Badge>
      )
    }
  },
  {
    accessorKey: 'condition',
    header: 'Condição'
  },
  {
    accessorKey: 'language',
    header: 'Idioma'
  },
  {
    accessorKey: 'price',
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            className="-mr-4 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Preço (R$)
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price'))
      return (
        <div className="text-right font-mono tabular-nums font-medium">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}
        </div>
      )
    }
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            className="-mr-4 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Estoque
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const quantity = parseInt(row.getValue('quantity'), 10)
      return (
        <div className="text-right font-mono tabular-nums font-medium">
          {quantity}
        </div>
      )
    }
  }
]
