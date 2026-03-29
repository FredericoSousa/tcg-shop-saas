'use client'

import { Menu, Package2, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePathname } from "next/navigation"
import Link from 'next/link'
import { LayoutDashboard, Package, ShoppingCart, Settings } from "lucide-react"

const sidebarItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Estoque", href: "/admin/inventory", icon: Package },
  { name: "Vendas", href: "/admin/orders", icon: ShoppingCart },
]

export function Navbar() {
  const pathname = usePathname()

  // Find current page name for breadcrumb title
  const currentItem = sidebarItems.find(item =>
    item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
  )

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/20 px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger render={<Button
          variant="outline"
          size="icon"
          className="shrink-0 md:hidden"
        />}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <SheetHeader className="hidden">
            <SheetTitle>Menu de Navegação</SheetTitle>
          </SheetHeader>
          <nav className="grid gap-2 text-lg font-medium mt-6">
            <Link
              href="/admin/inventory"
              className="flex items-center gap-2 text-lg font-semibold mb-4"
            >
              <Package2 className="h-6 w-6 text-primary" />
              <span>Admin Panel</span>
            </Link>
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              const isStrictActive = item.href === '/admin' ? pathname === '/admin' : isActive

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-foreground ${isStrictActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground"
                    }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        <h1 className="text-lg font-bold tracking-tight md:text-xl text-primary">
          {currentItem?.name || 'Painel de Controle'}
        </h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="secondary" size="icon" className="rounded-full border shadow-sm" />}>
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt="Avatar" />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">L</AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem className="text-muted-foreground cursor-pointer">Minha Conta</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600 font-semibold cursor-pointer">Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
