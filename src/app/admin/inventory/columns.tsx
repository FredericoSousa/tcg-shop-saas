'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'

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
  }
}

export const columns: ColumnDef<InventoryRow>[] = [
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
            <img src={template.imageUrl} alt={template.name} className="w-10 h-14 object-cover rounded" />
          ) : (
            <div className="w-10 h-14 bg-gray-200 rounded" />
          )}
          <span className="font-semibold">{template.name}</span>
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
    cell: ({ row }) => <Badge variant="outline">{row.original.cardTemplate.set}</Badge>
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
        <Button
          variant="ghost"
          className="-ml-4 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Preço (R$)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price'))
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
    }
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="-ml-4 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Estoque
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    }
  }
]
