import { Sidebar } from "@/components/admin/sidebar";
import { Navbar } from "@/components/admin/navbar";
import { Footer } from "@/components/admin/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactNode } from "react";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

import { SidebarProvider } from "@/components/admin/sidebar-provider";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Check if user is authenticated
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

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
      <SidebarProvider>
        <AdminLayoutShell
          sidebar={<Sidebar tenant={tenant!} />}
          navbar={<Navbar username={session.username} />}
          footer={<Footer />}
        >
          {children}
        </AdminLayoutShell>
      </SidebarProvider>
    </ThemeProvider>
  );
}
