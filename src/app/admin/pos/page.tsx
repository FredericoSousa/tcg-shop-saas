import { POSClient } from "@/components/admin/pos/pos-client";
import { PageHeader } from "@/components/admin/page-header";
import { Monitor } from "lucide-react";

export const metadata = {
  title: "PDV - Terminal de Vendas",
  description: "Ponto de Venda para administradores",
};

export default function POSPage() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 h-full">
      <PageHeader
        title="PDV"
        description="Ponto de Venda para processar pedidos presenciais"
        icon={Monitor}
      />
      <div className="flex-1 rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm overflow-hidden">
        <POSClient />
      </div>
    </div>
  );
}
