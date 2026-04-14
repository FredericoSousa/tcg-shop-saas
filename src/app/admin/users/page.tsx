import "reflect-metadata";
import { container } from "@/lib/infrastructure/container";
import { ListUsersUseCase } from "@/lib/application/use-cases/settings-users.use-case";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const listUsersUseCase = container.resolve(ListUsersUseCase);
  const users = await listUsersUseCase.execute();

  return (
    <UsersClient initialUsers={users as any} />
  );
}
