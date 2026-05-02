import "reflect-metadata";
import Link from "next/link";
import { Building2, CheckCircle2, PauseCircle, Plus, Shield } from "lucide-react";
import { container } from "@/lib/infrastructure/container";
import { ListTenantsUseCase } from "@/lib/application/use-cases/tenant/list-tenants.use-case";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

export default async function InternalDashboardPage() {
  const listTenants = container.resolve(ListTenantsUseCase);
  const [all, activeOnly] = await Promise.all([
    listTenants.execute({ page: 1, limit: 1 }),
    listTenants.execute({ page: 1, limit: 1, active: true }),
  ]);

  const total = all.total;
  const active = activeOnly.total;
  const inactive = total - active;

  const kpis = [
    { title: "Tenants Totais", value: total, icon: Building2, color: "bg-blue-50 text-blue-600" },
    { title: "Tenants Ativos", value: active, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
    { title: "Tenants Inativos", value: inactive, icon: PauseCircle, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <PageHeader
        title="Painel Interno"
        description="Visão geral da plataforma e administração de tenants"
        icon={Shield}
        actions={
          <Link href="/internal/tenants/new">
            <Button size="sm" className="gap-2 h-9 rounded-xl">
              <Plus className="h-4 w-4" />
              Novo Tenant
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="rounded-xl bg-card border border-border p-5 flex items-start justify-between gap-4 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="text-2xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {kpi.title}
              </p>
              <p className="text-2xl font-black tracking-tight leading-none tabular-nums text-foreground">
                {kpi.value.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className={`p-2.5 rounded-xl ${kpi.color}`}>
              <kpi.icon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm p-6 space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Atalhos</h2>
        <p className="text-sm text-muted-foreground">
          Use a navegação lateral para gerenciar tenants. Esta área é restrita a super-administradores.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href="/internal/tenants">
            <Button variant="outline" size="sm" className="rounded-xl">
              <Building2 className="h-4 w-4 mr-2" />
              Listar Tenants
            </Button>
          </Link>
          <Link href="/internal/tenants/new">
            <Button variant="outline" size="sm" className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Criar Tenant
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
