"use client";

import { Menu, Sun, Moon, ChevronDown, UserCog, DollarSign, Cuboid, Settings } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
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

export function Navbar({ username }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme, theme } = useTheme();
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="hover:bg-muted/60 transition-all"
          suppressHydrationWarning
        >
          <div>
            {!mounted ? (
              <div className="h-[18px] w-[18px]" />
            ) : theme === "dark" ? (
              <Sun className="h-4.5 w-4.5" />
            ) : (
              <Moon className="h-4.5 w-4.5" />
            )}
          </div>
          <span className="sr-only">Mudar Tema</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-muted/60 transition-all px-2"
              />
            }
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt="Avatar" />
              <AvatarFallback className="bg-primary/15 text-primary font-bold text-sm">
                {username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm font-medium">
              {username || "Usuário"}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-sm font-semibold">{username}</span>
                <span className="text-xs text-muted-foreground font-normal">Minha Conta</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer hover:bg-muted/60">
                <span>Minha Conta</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-muted/60">
                <span>Configurações</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer font-medium"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
              }}
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
