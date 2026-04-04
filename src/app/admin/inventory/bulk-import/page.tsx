import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { BulkImportForm } from './bulk-import-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function BulkImportPage() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-dashed text-center">
        <h1 className="text-2xl font-bold text-destructive mb-2">Autenticação Necessária</h1>
        <p className="text-muted-foreground">Você precisa estar em um subdomínio válido de lojista.</p>
      </div>
    )
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  })

  return (
    <div className="flex flex-col gap-6 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/admin/inventory">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Importação em Massa</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Adicione múltiplos cards ao estoque de <span className="font-semibold text-foreground">{tenant?.name || 'sua loja'}</span>.
            </p>
          </div>
        </div>
      </div>

      <BulkImportForm />
    </div>
  )
}
