import { PageHeader } from "@/components/admin/page-header";
import { Settings } from "lucide-react";
import { SettingsContent } from "@/components/admin/settings-content";

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <PageHeader
        title="Configurações"
        description="Gerencie as informações, aparência e redes sociais da sua loja"
        icon={Settings}
      />

      <SettingsContent />
    </div>
  );
}
