"use client";

import Link from "next/link";
import { CartDrawer } from "@/components/shop/cart-drawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LiveSearch } from "@/components/storefront/live-search";

export function Navbar({ tenant }: { tenant: { name: string; logoUrl?: string | null; description?: string | null } | null }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md text-zinc-900 shadow-sm">
      <div className="container flex h-16 items-center px-4 md:px-6 mx-auto">
        {/* Mobile Menu Trigger */}
        <div className="lg:hidden mr-2">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-600 hover:bg-zinc-100 rounded-xl">
                  <Menu className="h-5 w-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-[300px] p-0 border-r border-zinc-100">
              <div className="flex flex-col h-full bg-white">
                <SheetHeader className="p-6 border-b border-zinc-50 text-left">
                  <SheetTitle className="flex items-center gap-3">
                    {tenant?.logoUrl ? (
                      <Image src={tenant.logoUrl} alt={tenant.name || "Logo"} width={32} height={32} className="h-8 w-auto object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center shadow-lg">
                        <span className="text-white font-black text-sm uppercase">
                          {tenant?.name?.charAt(0) || "T"}
                        </span>
                      </div>
                    )}
                    <span className="font-black text-zinc-950 tracking-tight lowercase">
                      {tenant?.name || "tcg shop"}
                    </span>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6 px-6 space-y-8">
                  <div className="space-y-4">
                    <p className="text-2xs font-bold uppercase tracking-widest text-zinc-400 px-2">Navegação</p>
                    <div className="grid gap-1">
                      <Link
                        href="/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-4 p-3 font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 rounded-xl transition-all"
                      >
                        Início
                      </Link>
                      <Link
                        href="/singles"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-4 p-3 font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 rounded-xl transition-all"
                      >
                        Singles
                      </Link>
                      <Link
                        href="/products"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-4 p-3 font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 rounded-xl transition-all"
                      >
                        Produtos
                      </Link>
                      <Link
                        href="/buylist"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-4 p-3 font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 rounded-xl transition-all"
                      >
                        Buylist
                      </Link>
                    </div>
                  </div>

                  {pathname === "/" && (
                    <div className="space-y-4">
                      <p className="text-2xs font-bold uppercase tracking-widest text-zinc-400 px-2">Busca Rápida</p>
                      <LiveSearch
                        inputClassName="h-11 bg-zinc-50 border-zinc-100 rounded-xl focus:ring-primary/20 focus:border-primary"
                        onResultClick={() => setIsMobileMenuOpen(false)}
                      />
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-zinc-50">
                  <p className="text-2xs font-bold text-zinc-400 uppercase leading-relaxed">
                    {tenant?.description || "Sua loja favorita de TCG."}
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="mr-8 flex">
          <Link href="/" className="flex items-center space-x-3 group">
            {tenant?.logoUrl ? (
              <Image src={tenant.logoUrl} alt={tenant.name || "Logo"} width={32} height={32} className="h-8 w-auto object-contain transition-transform group-hover:scale-105" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                <span className="text-white font-black text-sm uppercase">
                  {tenant?.name?.charAt(0) || "T"}
                </span>
              </div>
            )}
            {!tenant?.logoUrl && <span className="hidden font-black sm:inline-block text-lg text-zinc-950 tracking-tight lowercase">
              {tenant?.name || "tcg shop"}
              <span className="text-primary">.</span>
            </span>}
          </Link>
        </div>

        <div className="hidden lg:flex items-center space-x-6 text-2xs font-bold uppercase tracking-wider text-zinc-600">
          <Link
            href="/"
            className="transition-all hover:text-zinc-950"
          >
            Início
          </Link>
          <Link
            href="/singles"
            className="transition-all hover:text-zinc-950"
          >
            Singles
          </Link>
          <Link
            href="/products"
            className="transition-all hover:text-zinc-950"
          >
            Produtos
          </Link>
          <Link
            href="/buylist"
            className="transition-all hover:text-zinc-950"
          >
            Buylist
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 md:gap-6 ml-4">
          {pathname === "/" && (
            <LiveSearch
              className="hidden lg:block max-w-[320px]"
              onResultClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          <nav className="flex items-center gap-4">
            <CartDrawer />
          </nav>
        </div>
      </div>
    </nav>
  );
}
