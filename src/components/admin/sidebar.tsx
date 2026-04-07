"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Users,
  UserCog,
  Monitor,
  ShoppingBag,
} from "lucide-react";
import { Tenant } from "@prisma/client";

const sidebarItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "PDV", href: "/admin/pos", icon: Monitor },
  { name: "Singles", href: "/admin/inventory", icon: Package },
  { name: "Vendas", href: "/admin/orders", icon: ShoppingCart },
  { name: "Produtos", href: "/admin/products", icon: ShoppingBag },
  { name: "Clientes", href: "/admin/customers", icon: Users },
  { name: "Usuários", href: "/admin/users", icon: UserCog },
  { name: "Configurações", href: "/admin/settings", icon: Settings },
];

interface SidebarProps {
  tenant: Tenant;
}

import { useSidebar } from "./sidebar-provider";

export function Sidebar({ tenant }: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  return (
    <div className={`hidden border-r border-border/50 bg-gradient-to-b from-background via-background to-background/80 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 md:flex flex-shrink-0 h-full flex-col transition-all duration-300 ease-in-out ${
      isCollapsed ? "w-[70px]" : "w-[260px]"
    }`}>
      <div className={`flex h-16 items-center border-b border-border/50 dark:border-slate-800 lg:h-[70px] transition-all duration-300 ${
        isCollapsed ? "px-4 justify-center" : "px-6"
      }`}>
        <Link
          href="/admin"
          className="flex items-center gap-3 font-bold text-lg tracking-tight group overflow-hidden"
        >
          {tenant.logoUrl ? (
            <div className="flex flex-col gap-0.5 shrink-0">
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className={isCollapsed ? "h-8 w-8 object-contain" : "h-auto w-auto"}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
                {tenant.name?.charAt(0) || "T"}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col gap-0.5 whitespace-nowrap animate-in fade-in duration-500">
                  <span className="text-foreground dark:text-white font-semibold">
                    {tenant.name || "TCG Admin"}
                  </span>
                  <span className="text-xs text-muted-foreground dark:text-slate-300 font-normal">
                    Painel de Controle
                  </span>
                </div>
              )}
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3">
        <div className="space-y-1.5">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const isStrictActive =
              item.href === "/admin" ? pathname === "/admin" : isActive;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.name : ""}
                className={`group flex items-center rounded-lg transition-all duration-200 ${
                  isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"
                } ${isStrictActive
                  ? "bg-primary text-white shadow-md hover:shadow-lg hover:bg-primary/90 dark:bg-primary dark:text-slate-950 dark:hover:bg-primary/95"
                  : "text-muted-foreground dark:text-slate-50 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-slate-700/60"
                  }`}
              >
                <item.icon className={`${isCollapsed ? "h-5.5 w-5.5" : "h-4.5 w-4.5"} shrink-0`} />
                {!isCollapsed && (
                  <span className="text-sm font-medium whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
