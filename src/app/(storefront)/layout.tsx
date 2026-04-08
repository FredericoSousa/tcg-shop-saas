import { getTenant } from "@/lib/tenant-server";
import { Navbar } from "@/components/storefront/navbar";
import { Footer } from "@/components/storefront/footer";
import { Suspense, ReactNode } from "react";

export async function generateMetadata() {
  const tenant = await getTenant();

  return {
    title: tenant?.name || "TCG Shop",
    description: tenant?.description || "Sua loja especializada em Trading Card Games.",
  };
}

export default function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Suspense fallback={<NavbarSkeleton />}>
        <NavbarContent />
      </Suspense>
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <Suspense fallback={<div className="h-20" />}>
        <FooterContent />
      </Suspense>
    </div>
  );
}

async function NavbarContent() {
  const tenant = await getTenant();
  return <Navbar tenant={tenant} />;
}

async function FooterContent() {
  const tenant = await getTenant();
  return <Footer tenant={tenant} />;
}

function NavbarSkeleton() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950 h-16 animate-pulse">
      <div className="container flex h-full items-center px-4 mx-auto" />
    </nav>
  );
}
