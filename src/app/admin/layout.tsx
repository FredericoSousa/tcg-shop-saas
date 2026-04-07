import { Sidebar } from "@/components/admin/sidebar";
import { Navbar } from "@/components/admin/navbar";
import { Footer } from "@/components/admin/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactNode } from "react";
import { getAdminContext } from "@/lib/tenant-server";

import { SidebarProvider } from "@/components/admin/sidebar-provider";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { session, tenant } = await getAdminContext();

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
