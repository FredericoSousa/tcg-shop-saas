import "reflect-metadata";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { container } from "@/lib/infrastructure/container";
import { GetTenantUseCase } from "@/lib/application/use-cases/tenant/get-tenant.use-case";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { TenantEditForm } from "@/components/internal/tenant-edit-form";

export default async function TenantDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const getTenant = container.resolve(GetTenantUseCase);
  const tenant = await getTenant.execute({ id });
  if (!tenant) notFound();

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <PageHeader
        title={tenant.name}
        description={`Slug: ${tenant.slug}`}
        icon={Building2}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={tenant.active ? "ACTIVE" : "INACTIVE"} />
            <Link href="/internal/tenants">
              <Button variant="outline" size="sm" className="gap-2 h-9 rounded-xl">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
        }
      />

      <div className="rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm p-6">
        <TenantEditForm tenant={tenant} />
      </div>

      <div className="rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm p-6 space-y-3 text-sm">
        <h2 className="text-base font-bold tracking-tight text-foreground">Metadados</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <dt className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">ID</dt>
            <dd className="font-mono text-xs break-all">{tenant.id}</dd>
          </div>
          <div>
            <dt className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">Criado em</dt>
            <dd>
              {tenant.createdAt
                ? new Date(tenant.createdAt).toLocaleString("pt-BR")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">Atualizado em</dt>
            <dd>
              {tenant.updatedAt
                ? new Date(tenant.updatedAt).toLocaleString("pt-BR")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">Webhook configurado</dt>
            <dd>{tenant.webhookUrl ? "Sim" : "Não"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
