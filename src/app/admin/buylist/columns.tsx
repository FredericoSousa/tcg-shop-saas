import { ColumnDef } from '@tanstack/react-table'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { SetBadge } from '@/components/ui/set-badge'
import { BuylistStatus } from '@/lib/domain/entities/buylist'
import { StatusBadge } from '@/components/admin/status-badge'
import { MoreHorizontal, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { BuylistService } from '@/lib/api/services/buylist.service'
import { useRouter } from 'next/navigation'
import { feedback } from '@/lib/utils/feedback'
import Link from 'next/link'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})

export type BuylistItemRow = {
  id: string
  priceCash: number
  priceCredit: number
  active: boolean
  cardTemplate: {
    name: string
    set: string
    imageUrl: string | null
  }
}

export type BuylistProposalRow = {
  id: string
  status: BuylistStatus
  totalCash: number
  totalCredit: number
  createdAt: Date
  customer?: {
    name: string
  }
}

export const buylistItemColumns: ColumnDef<BuylistItemRow>[] = [
  {
    accessorKey: 'cardTemplate.name',
    header: 'Card',
    cell: ({ row }) => {
      const template = row.original.cardTemplate
      return (
        <div className="flex items-center gap-3">
          {template.imageUrl ? (
            <div className="relative w-10 h-14 shrink-0 rounded overflow-hidden">
              <Image src={template.imageUrl} alt={template.name} className="object-cover" fill />
            </div>
          ) : (
            <div className="w-10 h-14 bg-muted rounded" />
          )}
          <div className="flex flex-col">
            <span className="font-semibold">{template.name}</span>
            <div className="flex items-center gap-1">
              <SetBadge setCode={template.set} />
            </div>
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: 'priceCash',
    header: 'Compra (Dinheiro)',
    cell: ({ row }) => formatCurrency(row.original.priceCash)
  },
  {
    accessorKey: 'priceCredit',
    header: 'Compra (Crédito)',
    cell: ({ row }) => (
      <span className="font-medium text-primary">
        {formatCurrency(row.original.priceCredit)}
      </span>
    )
  },
  {
    accessorKey: 'active',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.active ? "secondary" : "outline"}>
        {row.original.active ? "Ativo" : "Inativo"}
      </Badge>
    )
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => {
      const item = row.original;

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const router = useRouter();

      const handleDelete = async () => {
        try {
          const result = await BuylistService.deleteItem(item.id);
          if (result.success) {
            feedback.success("Item removido da buylist");
            router.refresh();
          }
        } catch (error) {
          feedback.apiError(error, "Erro ao remover item");
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          } />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remover da Lista
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

export const buylistProposalColumns: ColumnDef<BuylistProposalRow>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <span className="font-mono text-xs">#{row.original.id.slice(0, 8)}</span>
  },
  {
    accessorKey: 'customer.name',
    header: 'Cliente',
    cell: ({ row }) => row.original.customer?.name || 'Cliente Avulso'
  },
  {
    accessorKey: 'createdAt',
    header: 'Data',
    cell: ({ row }) => dateFormatter.format(new Date(row.original.createdAt))
  },
  {
    accessorKey: 'totalCredit',
    header: 'Valor (Crédito)',
    cell: ({ row }) => formatCurrency(row.original.totalCredit)
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => {
      const proposal = row.original

      return (
        <div className="flex items-center gap-2">
          <Link href={`/admin/buylist-proposal/${proposal.id}`}>
            <Button variant="ghost" size="sm" className="h-8 gap-2">
              <Eye className="h-4 w-4" />
              Ver Detalhes
            </Button>
          </Link>
        </div>
      );
    }
  }
]
