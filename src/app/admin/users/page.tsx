import "reflect-metadata";
import { container } from "@/lib/infrastructure/container";
import { ListUsersUseCase } from "@/lib/application/use-cases/list-users.use-case";
import { UsersClient } from "./users-client";

export default async function UsersPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = typeof searchParams?.search === "string" ? searchParams.search : undefined;

  const listUsersUseCase = container.resolve(ListUsersUseCase);
  const { items, total, pageCount } = await listUsersUseCase.execute({ page, limit, search });

  return (
    <UsersClient 
      initialUsers={items} 
      initialTotal={total} 
      initialPageCount={pageCount} 
    />
  );
}
