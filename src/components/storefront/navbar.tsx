"use client";

import Link from "next/link";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Navbar({ tenant }: { tenant: { name: string; logoUrl?: string | null } | null }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/singles?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950 text-zinc-100 shadow-xl">
      <div className="container flex h-16 items-center px-4 mx-auto">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-3 group">
            {tenant?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl} alt={tenant.name} className="h-8 w-auto object-contain transition-transform group-hover:scale-110" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12">
                <span className="text-white font-black text-sm uppercase">
                  {tenant?.name?.charAt(0) || "T"}
                </span>
              </div>
            )}
            {!tenant?.logoUrl && <span className="hidden font-black sm:inline-block text-white tracking-tight">
              {tenant?.name || "TCG Shop"}
            </span>}
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-6 text-sm font-bold uppercase tracking-widest">
          <Link
            href="/"
            className="transition-all text-zinc-400 hover:text-white hover:scale-105"
          >
            Início
          </Link>
          <Link
            href="/singles"
            className="transition-all text-zinc-400 hover:text-white hover:scale-105"
          >
            Singles
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end gap-4 ml-4">
          <form onSubmit={handleSearch} className="relative w-full max-w-[300px] hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              type="search"
              placeholder="Buscar cartas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-800 text-white h-9 rounded-full focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-zinc-600"
            />
          </form>
          
          <nav className="flex items-center space-x-2">
            <CartDrawer />
          </nav>
        </div>
      </div>
    </nav>
  );
}
