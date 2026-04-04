import Link from "next/link";
import { CartDrawer } from "@/components/shop/CartDrawer";

export function Navbar({ tenant }: { tenant: { name: string; brandColor: string | null } | null }) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="container flex h-16 items-center px-4 mx-auto">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {tenant?.name?.charAt(0) || "T"}
              </span>
            </div>
            <span className="hidden font-bold sm:inline-block text-white">
              {tenant?.name || "TCG Shop"}
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/"
                className="transition-colors hover:text-foreground/80 text-foreground/60 text-zinc-300 hover:text-white"
              >
                Início
              </Link>
              <Link
                href="/singles"
                className="transition-colors hover:text-foreground/80 text-foreground/60 text-zinc-300 hover:text-white"
              >
                Singles
              </Link>
            </nav>
          </div>
          <nav className="flex items-center space-x-2">
            <CartDrawer />
          </nav>
        </div>
      </div>
    </nav>
  );
}
