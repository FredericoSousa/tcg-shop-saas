import "reflect-metadata";
import { container } from "@/lib/infrastructure/container";
import { ListCustomersUseCase } from "@/lib/application/use-cases/list-customers.use-case";
import { ensureTenantContext } from "@/lib/tenant-server";
import { CustomersClient } from "./customers-client";

export default async function CustomersPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await ensureTenantContext();
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = typeof searchParams?.search === "string" ? searchParams.search : undefined;
  const includeDeleted = searchParams?.includeDeleted === "true";

  const listCustomersUseCase = container.resolve(ListCustomersUseCase);
  const { items, total, pageCount } = await listCustomersUseCase.execute({
    page,
    limit,
    filters: {
      search,
      includeDeleted
    }
  });

  return (
    <CustomersClient
      initialCustomers={items}
      initialTotal={total}
      initialPageCount={pageCount}
    />
  );
}
