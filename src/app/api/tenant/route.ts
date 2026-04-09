import "reflect-metadata";
import { container } from "@/lib/infrastructure/container";
import { GetTenantUseCase } from "@/lib/application/use-cases/get-tenant.use-case";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return Response.json({ error: 'Slug is required' }, { status: 400 })
  }

  try {
    const getTenantUseCase = container.resolve(GetTenantUseCase);
    const tenant = await getTenantUseCase.execute({ slug });

    if (!tenant) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return Response.json(tenant)
  } catch (error) {
    console.error("Error fetching tenant by slug:", error);
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
