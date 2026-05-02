"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LayoutDashboard, Shield, LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/internal", icon: LayoutDashboard, exact: true },
  { name: "Tenants", href: "/internal/tenants", icon: Building2 },
];

interface InternalShellProps {
  email: string;
  children: ReactNode;
}

export function InternalShell({ email, children }: InternalShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[260px_1fr] bg-background font-sans antialiased text-foreground">
      <aside className="hidden md:flex flex-col border-r border-border/50 bg-gradient-to-b from-background via-background to-background/80 sticky top-0 h-screen">
        <div className="flex h-16 items-center gap-3 border-b border-border/50 px-6 lg:h-[70px]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-foreground">Painel Interno</span>
            <span className="text-xs text-muted-foreground font-medium">Super-Admin</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-white shadow-md hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/50">
          <div className="flex items-center gap-2 justify-between">
            <Avatar className="h-9 w-9 border-2 border-amber-500/20 shrink-0">
              <AvatarFallback className="bg-amber-500/15 text-amber-600 font-bold">
                {email.charAt(0).toUpperCase() || "S"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-sm font-semibold truncate" title={email}>
                {email}
              </span>
              <span className="text-2xs text-muted-foreground uppercase tracking-widest leading-tight">
                Super-Admin
              </span>
            </div>
            <button
              onClick={async () => {
                const supabase = createSupabaseBrowserClient();
                await supabase.auth.signOut();
                router.push("/login");
                router.refresh();
              }}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive-muted rounded-lg transition-all"
              title="Sair"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/5 w-full overflow-hidden">
        <header className="md:hidden sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border/50 bg-background/95 backdrop-blur-sm px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <span className="font-bold text-foreground">Painel Interno</span>
          </div>
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">{email}</span>
        </header>
        <main className="flex-1 flex flex-col gap-5 p-3 md:p-4 lg:p-6 w-full">{children}</main>
      </div>
    </div>
  );
}
