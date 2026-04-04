import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/storefront/navbar";

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
      select: { name: true, brandColor: true },
    });
  }

  const customStyles = tenant?.brandColor
    ? ({ "--primary": tenant.brandColor } as React.CSSProperties)
    : {};

  return (
    <div className="flex flex-col min-h-screen bg-background" style={customStyles}>
      <Navbar tenant={tenant} />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      {/* Footer */}
      <footer className="bg-zinc-950 text-zinc-400 text-center py-8 text-sm font-medium">
        <p>© {new Date().getFullYear()} {tenant?.name}. Todos os direitos reservados.</p>
        <p className="mt-1 text-zinc-600">Powered by TCG Shop SaaS</p>
      </footer>
    </div>
  );
}
