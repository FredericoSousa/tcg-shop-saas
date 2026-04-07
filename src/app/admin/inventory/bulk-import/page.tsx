import { getAdminContext } from '@/lib/tenant-server'
import { BulkImportForm } from './bulk-import-form'
import Link from 'next/link'
import { ArrowLeft, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/admin/page-header'

export default async function BulkImportPage() {
  const { tenant } = await getAdminContext();

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
