import { headers } from "next/headers";
import { PageHeader } from "@/components/admin/page-header";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "./data-table";
import { getProductsPaginated, getCategories } from "@/lib/services/product.service";
import { ProductDialog } from "./product-dialog";
import { CategoriesDialog } from "./categories-dialog";

export default async function ProductsPage(props: {
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
          Você precisa estar em um subdomínio válido de lojista.
        </p>
      </div>
    );
  }

  const { items, pageCount } = await getProductsPaginated(tenantId, page, limit, search);
  const categories = await getCategories(tenantId);

  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        title="Gestão de Produtos"
        description="Gerencie seus produtos não-TCG como acessórios, embalagens e colecionáveis."
        icon={Package}
        actions={
          <div className="flex gap-2">
            <CategoriesDialog categories={categories} />
            <ProductDialog categories={categories}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Produto
              </Button>
            </ProductDialog>
          </div>
        }
      />

      <div className="bg-card rounded-lg shadow-sm border p-3 md:p-4 overflow-hidden">
        <DataTable data={items} pageCount={pageCount} categories={categories} />
      </div>
    </div>
  );
}
