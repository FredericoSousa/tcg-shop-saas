import { ReactNode, Suspense } from "react";
import { getSuperAdminContext } from "@/lib/super-admin-server";
import { InternalShell } from "@/components/internal/internal-shell";
import { Feedback } from "@/components/ui/feedback";

export const metadata = {
  title: "Painel Interno · TCG Shop SaaS",
};

export default function InternalLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<InternalLoading />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  const { session } = await getSuperAdminContext();
  return <InternalShell email={session.email}>{children}</InternalShell>;
}

function InternalLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Feedback type="loading" title="Carregando painel interno..." />
    </div>
  );
}
