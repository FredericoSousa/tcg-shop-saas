import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ShopClient } from "@/components/shop/ShopClient";
import { Sparkles } from "lucide-react";
import { getStorefrontInventory, getStorefrontFilters } from "@/lib/services/inventory.service";

export default async function ShopPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const filters = {
    color: typeof searchParams?.color === "string" ? searchParams.color : undefined,
    type: typeof searchParams?.type === "string" ? searchParams.type : undefined,
    set: typeof searchParams?.set === "string" ? searchParams.set : undefined,
  };

  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return (
      <div className="p-8 text-center pt-24 min-h-screen flex items-center justify-center bg-muted/20">
        <div className="bg-white p-12 rounded-2xl shadow-sm border max-w-md w-full space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <h1 className="text-2xl font-black mb-2">Loja não encontrada</h1>
          <p className="text-muted-foreground text-sm">
            Não foi possível identificar o lojista para esta página.
          </p>
        </div>
      </div>
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  const { items: inventory, total, pageCount } = await getStorefrontInventory(tenantId, page, filters);
  const storefrontFilters = await getStorefrontFilters(tenantId);

  // Convert hex to HSL if needed, or simply pass hex if CSS variables in the project support it.
  // Assuming the project is set up with Tailwind where --primary needs HSL, or just overriding the style.
  const customStyles = tenant?.brandColor 
    ? ({ "--primary": tenant.brandColor } as React.CSSProperties) 
    : {};

  return (
    <main className="flex-1 bg-background min-h-screen" style={customStyles}>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden shadow-2xl">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,_theme(colors.white)_1px,_transparent_0)] [background-size:24px_24px]"></div>

        {/* Gradient orbs */}
        <div className="absolute top-1/4 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-primary/30 blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 left-0 -ml-40 -mb-40 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>

        <div className="relative container mx-auto py-24 md:py-32 px-6 text-center z-10 flex flex-col items-center space-y-8">
          {/* Logo Avatar */}
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300 ring-4 ring-white/20">
            <span className="text-5xl font-black text-white">
              {tenant?.name?.charAt(0) || "T"}
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight drop-shadow-lg text-white leading-tight">
              {tenant?.name || "TCG Shop"}
            </h1>
            <p className="text-xl md:text-2xl text-slate-200 font-medium drop-shadow-md">
              O baú do tesouro oficial de cards do{" "}
              {tenant?.name || "nosso lojista"}. Encontre singles em tempo real.
            </p>
          </div>

          {/* CTA Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all">
            <span className="text-sm text-white/80">
              ✨ Explore nossa coleção
            </span>
          </div>
        </div>
      </div>

      {/* Shop Content */}
      <div className="container mx-auto px-4 py-16 md:py-20">
        <ShopClient 
          tenantId={tenantId} 
          initialInventory={inventory} 
          availableFilters={storefrontFilters}
          pageCount={pageCount}
          totalItems={total}
          currentPage={page}
        />
      </div>
    </main>
  );
}
