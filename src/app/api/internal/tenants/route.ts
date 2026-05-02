import { NextRequest } from "next/server";
import { withSuperAdminApi } from "@/lib/super-admin-server";
import { container } from "@/lib/infrastructure/container";
import { ListTenantsUseCase } from "@/lib/application/use-cases/tenant/list-tenants.use-case";
import { CreateTenantUseCase } from "@/lib/application/use-cases/tenant/create-tenant.use-case";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

export async function GET(request: NextRequest) {
  return withSuperAdminApi(async () => {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const search = searchParams.get("search") ?? undefined;
    const activeRaw = searchParams.get("active");
    const active = activeRaw === "active" ? true : activeRaw === "inactive" ? false : undefined;

    const useCase = container.resolve(ListTenantsUseCase);
    const result = await useCase.execute({ page, limit, search, active });
    return ApiResponse.success(result);
  });
}

export async function POST(request: NextRequest) {
  return withSuperAdminApi(async () => {
    const body = await request.json();
    const useCase = container.resolve(CreateTenantUseCase);
    const tenant = await useCase.execute(body);
    return ApiResponse.created(tenant, "Tenant criado com sucesso");
  });
}
