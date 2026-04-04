'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, ShoppingCart, Settings, Upload } from "lucide-react"

const sidebarItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Estoque", href: "/admin/inventory", icon: Package },
  { name: "Vendas", href: "/admin/orders", icon: ShoppingCart },
  { name: "Configurações", href: "/admin/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden border-r bg-muted/20 md:block md:w-64 flex-shrink-0 h-full">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/admin/inventory" className="flex items-center gap-2 font-semibold">
            <Package className="h-6 w-6 text-primary" />
            <span className="">Administração</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

              // Evitar que /admin matche sub-páginas se estiver no Dashboard raiz (mas não temos dashboard ainda)
              const isStrictActive = item.href === '/admin' ? pathname === '/admin' : isActive

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${isStrictActive
                      ? "bg-muted text-primary font-semibold"
                      : "text-muted-foreground"
                    }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
