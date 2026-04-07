import { getTenant } from "@/lib/tenant-server";

export async function GET() {
  try {
    const tenant = await getTenant();

    if (!tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    return Response.json({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
    });
  } catch (error) {
    console.error("Error fetching current tenant:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
