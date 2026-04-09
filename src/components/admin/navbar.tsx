"use client";

import { Menu, Sun, Moon, ChevronDown, UserCog, DollarSign, Cuboid, Settings, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, Users } from "lucide-react";

const sidebarItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Singles", href: "/admin/inventory", icon: Cuboid },
  { name: "Vendas", href: "/admin/orders", icon: DollarSign },
  { name: "Usuários", href: "/admin/users", icon: UserCog },
  { name: "Produtos", href: "/admin/products", icon: Package },
  { name: "Clientes", href: "/admin/customers", icon: Users },
  { name: "PDV", href: "/admin/pos", icon: ShoppingCart },
  { name: "Configurações", href: "/admin/settings", icon: Settings },
];

interface NavbarProps {
  username?: string;
}

import { PanelLeft } from "lucide-react";
import { useSidebar } from "./sidebar-provider";

export function Navbar({ username }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const { toggleSidebar, isCollapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Find current page name for breadcrumb title
  const currentItem = sidebarItems.find((item) =>
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href),
  );

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border/50 bg-gradient-to-r from-background to-background/95 backdrop-blur-md px-4 lg:h-[70px] lg:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 md:hidden hover:bg-muted/60"
              />
            }
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0">
            <SheetHeader className="border-b border-border/30 px-6 py-5">
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <nav className="grid gap-1 text-sm font-medium p-4 flex-1">
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors"
              >
                <Package className="h-5 w-5 text-primary" />
                <span className="font-semibold">Admin Panel</span>
              </Link>
              <div className="my-2 border-t border-border/30"></div>
              {sidebarItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const isStrictActive =
                  item.href === "/admin" ? pathname === "/admin" : isActive;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${isStrictActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hidden md:flex hover:bg-muted/60 transition-all text-muted-foreground hover:text-foreground"
          title={isCollapsed ? "Expandir Sidebar" : "Recolher Sidebar"}
        >
          <PanelLeft className={`h-5 w-5 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            {currentItem?.name || "Painel de Controle"}
          </h1>
          {currentItem && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
              <currentItem.icon className="h-3.5 w-3.5" />
              {currentItem.name}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
      </div>
    </header>
  );
}
