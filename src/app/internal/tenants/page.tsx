import "reflect-metadata";
import Link from "next/link";
import { Building2, Plus, ChevronRight, ExternalLink } from "lucide-react";
import { container } from "@/lib/infrastructure/container";
import { ListTenantsUseCase } from "@/lib/application/use-cases/tenant/list-tenants.use-case";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TenantsListFilters } from "@/components/internal/tenants-list-filters";

interface SearchParams {
  page?: string;
  limit?: string;
  search?: string;
  active?: string;
}

export default async function InternalTenantsPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const page = Number(searchParams.page) || 1;
  const limit = Math.min(Number(searchParams.limit) || 20, 100);
  const search = searchParams.search?.trim() || undefined;
  const activeFilter =
    searchParams.active === "active" ? true : searchParams.active === "inactive" ? false : undefined;

  const listTenants = container.resolve(ListTenantsUseCase);
  const { items, total, pageCount } = await listTenants.execute({
    page,
    limit,
    search,
    active: activeFilter,
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <PageHeader
        title="Tenants"
        description="Gerencie todas as lojas hospedadas na plataforma"
        icon={Building2}
        actions={
          <Link href="/internal/tenants/new">
            <Button size="sm" className="gap-2 h-9 rounded-xl">
              <Plus className="h-4 w-4" />
              Novo Tenant
            </Button>
          </Link>
        }
      />

      <TenantsListFilters
        initialSearch={search ?? ""}
        initialActive={searchParams.active === "active" ? "active" : searchParams.active === "inactive" ? "inactive" : "all"}
        total={total}
      />

      <div className="rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Tenant</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhum tenant encontrado.
                </TableCell>
              </TableRow>
            ) : (
              items.map((t) => (
                <TableRow key={t.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold uppercase">
                        {t.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{t.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {t.createdAt
                            ? new Date(t.createdAt).toLocaleDateString("pt-BR")
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{t.slug}</TableCell>
                  <TableCell>
                    <StatusBadge status={t.active ? "ACTIVE" : "INACTIVE"} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.email ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <a
                        href={`https://${t.slug}.${getRootDomain()}/admin`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center justify-center rounded-md px-2 text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
                        title="Abrir loja"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Link
                        href={`/internal/tenants/${t.id}`}
                        className="inline-flex h-8 items-center justify-center rounded-md px-2 text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
                        title="Editar tenant"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between p-4 border-t border-border/30 text-sm text-muted-foreground">
          <span>
            Página {page} de {pageCount} · {total} tenant{total === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <PaginationLink page={page - 1} disabled={page <= 1} searchParams={searchParams}>
              Anterior
            </PaginationLink>
            <PaginationLink page={page + 1} disabled={page >= pageCount} searchParams={searchParams}>
              Próxima
            </PaginationLink>
          </div>
        </div>
      </div>
    </div>
  );
}

function getRootDomain() {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "example.com";
}

function PaginationLink({
  page,
  disabled,
  searchParams,
  children,
}: {
  page: number;
  disabled: boolean;
  searchParams: SearchParams;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="px-3 py-1.5 rounded-md text-xs font-medium opacity-50 cursor-not-allowed">
        {children}
      </span>
    );
  }
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (searchParams.limit) params.set("limit", searchParams.limit);
  if (searchParams.search) params.set("search", searchParams.search);
  if (searchParams.active) params.set("active", searchParams.active);
  return (
    <Link
      href={`/internal/tenants?${params.toString()}`}
      className="px-3 py-1.5 rounded-md text-xs font-medium border hover:bg-muted/50 transition-colors"
    >
      {children}
    </Link>
  );
}
