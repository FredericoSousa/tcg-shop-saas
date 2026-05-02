import { NextRequest } from "next/server";
import { withSuperAdminApi } from "@/lib/super-admin-server";
import { container } from "@/lib/infrastructure/container";
import { GetTenantUseCase } from "@/lib/application/use-cases/tenant/get-tenant.use-case";
import { UpdateTenantAdminUseCase } from "@/lib/application/use-cases/tenant/update-tenant-admin.use-case";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import { revalidateTag } from "next/cache";

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  return withSuperAdminApi(async () => {
    const { id } = await props.params;
    const useCase = container.resolve(GetTenantUseCase);
    const tenant = await useCase.execute({ id });
    if (!tenant) return ApiResponse.notFound("Tenant não encontrado");
    return ApiResponse.success(tenant);
  });
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  return withSuperAdminApi(async () => {
    const { id } = await props.params;
    const body = await request.json();
    const useCase = container.resolve(UpdateTenantAdminUseCase);
    const tenant = await useCase.execute({ ...body, id });

    // Bust the cached tenant lookup so the storefront and admin layouts
    // observe the new state (notably `active`) on the next request.
    revalidateTag(`tenant-${id}`, "max");

    return ApiResponse.success(tenant, "Tenant atualizado");
  });
}
