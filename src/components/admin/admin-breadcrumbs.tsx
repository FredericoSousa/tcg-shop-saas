"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  inventory: "Singles",
  "bulk-import": "Importar em Massa",
  orders: "Vendas",
  products: "Produtos",
  customers: "Clientes",
  buylist: "Buylist",
  "buylist-proposal": "Proposta de Buylist",
  users: "Usuários",
  settings: "Configurações",
  pos: "PDV",
  proposals: "Propostas",
  drafts: "Rascunhos",
  new: "Novo",
};

function prettify(segment: string) {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  // UUID-like or long id → shorten
  if (segment.length >= 20 || /^[a-f0-9-]{8,}$/i.test(segment)) {
    return `#${segment.slice(0, 8)}`;
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Only render when we're deeper than /admin/<section>
  if (segments.length < 3) return null;

  const crumbs = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const label = prettify(seg);
    const isLast = idx === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground py-2 px-1 overflow-x-auto">
      <Link
        href="/admin"
        className="flex items-center gap-1 hover:text-foreground transition-colors shrink-0"
        aria-label="Início do painel"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.slice(1).map((crumb) => (
        <div key={crumb.href} className="flex items-center gap-1.5 shrink-0">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
          {crumb.isLast ? (
            <span className="font-bold text-foreground truncate max-w-[200px]" aria-current="page">
              {crumb.label}
            </span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors truncate max-w-[160px]">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
