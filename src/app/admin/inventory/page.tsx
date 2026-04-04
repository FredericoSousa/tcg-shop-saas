import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { AddCardDialog } from "./add-card-dialog";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default async function InventoryPage() {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-dashed text-center">
        <h1 className="text-2xl font-bold text-destructive mb-2">
          Autenticação Necessária
        </h1>
        <p className="text-muted-foreground">
          Você precisa estar em um subdomínio válido de lojista ou logado para
          acessar esta página.
        </p>
      </div>
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  const rawInventory = await prisma.inventoryItem.findMany({
    where: { tenantId },
    include: {
      cardTemplate: true,
    },
    orderBy: {
      cardTemplate: { name: "asc" },
    },
  });

  const inventory = rawInventory.map((item) => ({
    id: item.id,
    price: Number(item.price), // converting Prisma Decimal to Number for client
    quantity: item.quantity,
    condition: item.condition,
    language: item.language,
    cardTemplate: {
      name: item.cardTemplate.name,
      set: item.cardTemplate.set,
      imageUrl: item.cardTemplate.imageUrl,
      metadata: item.cardTemplate.metadata as Record<string, unknown> | null,
    },
  }));

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-5 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
            Gestão de Estoque
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Gerencie o inventário da loja{" "}
            <span className="font-semibold text-foreground">
              {tenant?.name || "sua loja"}
            </span>
            .
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/inventory/bulk-import">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Importar em Massa
            </Button>
          </Link>
          <AddCardDialog />
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border p-3 md:p-4 overflow-hidden">
        <DataTable columns={columns} data={inventory} />
      </div>
    </div>
  );
}
