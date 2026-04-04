import { Sidebar } from "@/components/admin/sidebar";
import { Navbar } from "@/components/admin/navbar";
import { Footer } from "@/components/admin/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactNode } from "react";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  let tenant = null;
  if (tenantId) {
    tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="grid min-h-screen w-full md:grid-cols-[250px_1fr] bg-background font-sans antialiased text-foreground gap-0">
        <Sidebar tenantName={tenant?.name} />
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/5">
          <Navbar />
          <main className="flex-1 flex flex-col gap-5 p-3 md:p-4 lg:p-6 w-full">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </ThemeProvider>
  );
}
