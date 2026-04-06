import { PageHeader } from "@/components/admin/page-header";
import { Settings } from "lucide-react";
import { SettingsContent } from "@/components/admin/settings-content";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie as informações, aparência e redes sociais da sua loja"
        icon={Settings}
      />

      <SettingsContent />
    </div>
  );
}
