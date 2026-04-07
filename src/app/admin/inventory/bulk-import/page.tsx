import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { BulkImportForm } from './bulk-import-form'
import Link from 'next/link'
import { ArrowLeft, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/admin/page-header'

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
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <PageHeader
        title="Importação em Massa"
        description={`Adicione múltiplos cards ao estoque de ${tenant?.name || 'sua loja'}`}
        icon={Upload} // I should check if Upload is imported, yes it is.
        actions={
          <Link href="/admin/inventory">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <div className="rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm overflow-hidden p-6">
        <BulkImportForm />
      </div>
    </div>
  )
}
