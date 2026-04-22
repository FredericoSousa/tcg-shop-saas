import { Sidebar } from "@/components/admin/sidebar";
import { Navbar } from "@/components/admin/navbar";
import { Footer } from "@/components/admin/footer";
import { ReactNode, Suspense } from "react";
import { getAdminContext } from "@/lib/tenant-server";
import { SidebarProvider } from "@/components/admin/sidebar-provider";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { Feedback } from "@/components/ui/feedback";
import { ErrorBoundary } from "@/components/admin/error-boundary";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <Suspense fallback={<AdminLoading />}>
        <AuthenticatedContent>{children}</AuthenticatedContent>
      </Suspense>
    </SidebarProvider>
  );
}

async function AuthenticatedContent({ children }: { children: ReactNode }) {
  const { session, tenant } = await getAdminContext();

  return (
    <AdminLayoutShell
      sidebar={<Sidebar tenant={tenant!} email={session.email} />}
      navbar={<Navbar email={session.email} />}
      footer={<Footer />}
    >
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </Suspense>
    </AdminLayoutShell>
  );
}

function AdminLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Feedback type="loading" title="Preparando seu ambiente..." description="Isso deve levar apenas um momento." />
    </div>
  );
}
