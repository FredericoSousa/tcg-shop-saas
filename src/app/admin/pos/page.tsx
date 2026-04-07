import { POSClient } from "@/components/admin/pos/pos-client";
import { PageHeader } from "@/components/admin/page-header";

export const metadata = {
  title: "PDV - Terminal de Vendas",
  description: "Ponto de Venda para administradores",
};

export default function POSPage() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <PageHeader
        title="PDV / POS"
        description="Ponto de Venda para processar pedidos presenciais"
      />
      <div className="flex-1 bg-card rounded-xl border shadow-sm overflow-hidden">
        <POSClient />
      </div>
    </div>
  );
}
