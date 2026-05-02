import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { CreateTenantForm } from "@/components/internal/create-tenant-form";

export default function NewTenantPage() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <PageHeader
        title="Novo Tenant"
        description="Provisione uma nova loja na plataforma"
        icon={Building2}
      />
      <div className="rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm p-6">
        <CreateTenantForm />
      </div>
    </div>
  );
}
