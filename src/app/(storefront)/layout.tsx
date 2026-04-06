import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/storefront/navbar";
import { Footer } from "@/components/storefront/footer";

export async function generateMetadata() {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) return {};

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, description: true },
  });

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
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  let tenant = null;
  if (tenantId) {
    tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        description: true,
        logoUrl: true,
        email: true,
        phone: true,
        address: true,
        instagram: true,
        facebook: true,
        twitter: true,
        whatsapp: true
      },
    });
  }

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
