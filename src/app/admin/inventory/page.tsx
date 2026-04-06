import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { Package, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { AddCardDialog } from "./add-card-dialog";
import { getInventoryPaginated } from "@/lib/services/inventory.service";

export default async function InventoryPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = typeof searchParams?.search === "string" ? searchParams.search : undefined;

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

  const { items: rawInventory, pageCount } = await getInventoryPaginated(tenantId, page, limit, search);

  const inventory = rawInventory.map((item) => ({
    id: item.id,
    price: Number(item.price), // converting Prisma Decimal to Number for client
    quantity: item.quantity,
    condition: item.condition,
    language: item.language,
    extras: item.extras,
    cardTemplate: {
      name: item.cardTemplate.name,
      set: item.cardTemplate.set,
      imageUrl: item.cardTemplate.imageUrl,
      metadata: item.cardTemplate.metadata as Record<string, unknown> | null,
    },
  }));

  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        title="Gestão de Estoque"
        description={`Gerencie o inventário da loja ${tenant?.name || "sua loja"}`}
        icon={Package}
        actions={
          <>
            <Link href="/admin/inventory/bulk-import">
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Importar em Massa
              </Button>
            </Link>
            <AddCardDialog />
          </>
        }
      />

      <div className="bg-card rounded-lg shadow-sm border p-3 md:p-4 overflow-hidden">
        <DataTable columns={columns} data={inventory} pageCount={pageCount} />
      </div>
    </div>
  );
}
