"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
} from "lucide-react";

const sidebarItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Estoque", href: "/admin/inventory", icon: Package },
  { name: "Vendas", href: "/admin/orders", icon: ShoppingCart },
  { name: "Configurações", href: "/admin/settings", icon: Settings },
];

interface SidebarProps {
  tenantName?: string | null;
}

export function Sidebar({ tenantName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="hidden border-r border-border/50 bg-gradient-to-b from-background via-background to-background/80 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 md:flex md:w-64 flex-shrink-0 h-full flex-col">
      <div className="flex h-16 items-center border-b border-border/50 dark:border-slate-800 px-6 lg:h-[70px]">
        <Link
          href="/admin"
          className="flex items-center gap-3 font-bold text-lg tracking-tight group"
        >
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm group-hover:shadow-md transition-all">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground dark:text-white font-semibold">
              {tenantName || "TCG Admin"}
            </span>
            <span className="text-xs text-muted-foreground dark:text-slate-300 font-normal">
              Painel de Controle
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-auto py-6 px-3">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const isStrictActive =
              item.href === "/admin" ? pathname === "/admin" : isActive;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isStrictActive
                    ? "bg-primary text-white shadow-md hover:shadow-lg hover:bg-primary/90 dark:bg-primary dark:text-slate-950 dark:hover:bg-primary/95"
                    : "text-muted-foreground dark:text-slate-50 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-slate-700/60"
                }`}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                <span>{item.name}</span>
                {isStrictActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-white/60 dark:bg-white/80"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
