import { getTenant } from "@/lib/tenant-server";
import { Navbar } from "@/components/storefront/navbar";
import { Footer } from "@/components/storefront/footer";

export async function generateMetadata() {
  const tenant = await getTenant();

  return {
    title: tenant?.name || "TCG Shop",
    description: tenant?.description || "Sua loja especializada em Trading Card Games.",
  };
}

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenant();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar tenant={tenant} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer tenant={tenant} />
    </div>
  );
}
