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
  LogOut,
} from "lucide-react";
import { Tenant } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

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
  username?: string;
}

import { useSidebar } from "./sidebar-provider";

export function Sidebar({ tenant, username }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  return (
    <div className={`hidden border-r border-border/50 bg-gradient-to-b from-background via-background to-background/80 md:flex flex-shrink-0 h-screen sticky top-0 flex-col transition-all duration-300 ease-in-out ${isCollapsed ? "w-[70px]" : "w-[260px]"
      }`}>
      <div className={`flex h-16 items-center border-b border-border/50 lg:h-[70px] transition-all duration-300 ${isCollapsed ? "px-4 justify-center" : "px-6"
        }`}>
        <Link
          href="/admin"
          className="flex items-center gap-3 font-bold text-lg tracking-tight group overflow-hidden"
        >

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
              {tenant.name?.charAt(0) || "T"}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col gap-0.5 whitespace-nowrap animate-in fade-in duration-500">
                <span className="text-foreground font-semibold">
                  {tenant.name || "TCG Admin"}
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  Painel de Controle
                </span>
              </div>
            )}
          </div>
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
                className={`group flex items-center rounded-lg transition-all duration-200 ${isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"
                  } ${isStrictActive
                    ? "bg-primary text-white shadow-md hover:shadow-lg hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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

      {/* User Controls Footer */}
      <div className="p-3 border-t border-border/50">
        <div className={`flex items-center gap-2 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <Avatar className="h-9 w-9 border-2 border-primary/10 shrink-0">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/15 text-primary font-bold">
              {username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col text-left overflow-hidden animate-in fade-in slide-in-from-left-1 duration-300">
              <span className="text-sm font-semibold truncate">
                {username || "Usuário"}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight">
                Administrador
              </span>
            </div>
          )}


          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
            }}
            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Sair"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>

        </div>
      </div>
    </div>
  );
}
