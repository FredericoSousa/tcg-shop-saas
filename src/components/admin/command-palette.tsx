"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Monitor,
  Package,
  ShoppingCart,
  ShoppingBag,
  Users,
  HandCoins,
  UserCog,
  Settings,
  Plus,
  Search,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  const go = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ações rápidas"
      description="Busque páginas e comandos do painel."
    >
      <CommandInput placeholder="O que você quer fazer?" />
      <CommandList>
        <CommandEmpty>Nenhum comando encontrado.</CommandEmpty>

        <CommandGroup heading="Ações">
          <CommandItem onSelect={() => go("/admin/pos")}>
            <Monitor className="h-4 w-4" />
            <span>Abrir PDV (nova venda)</span>
            <CommandShortcut>F2</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/inventory?add=1")}>
            <Plus className="h-4 w-4" />
            <span>Adicionar carta ao estoque</span>
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/orders")}>
            <Search className="h-4 w-4" />
            <span>Buscar pedido</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navegar">
          <CommandItem onSelect={() => go("/admin")}>
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/inventory")}>
            <Package className="h-4 w-4" />
            <span>Singles</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/orders")}>
            <ShoppingCart className="h-4 w-4" />
            <span>Vendas</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/products")}>
            <ShoppingBag className="h-4 w-4" />
            <span>Produtos</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/customers")}>
            <Users className="h-4 w-4" />
            <span>Clientes</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/buylist")}>
            <HandCoins className="h-4 w-4" />
            <span>Buylist</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/users")}>
            <UserCog className="h-4 w-4" />
            <span>Usuários</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/settings")}>
            <Settings className="h-4 w-4" />
            <span>Configurações</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
