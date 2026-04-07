import { validateAdminApi } from "@/lib/tenant-server";
import {
  getCustomersPaginated,
  createCustomer,
} from "@/lib/services/customer.service";

export async function GET(request: Request) {
  const context = await validateAdminApi();

  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenant } = context;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || undefined;
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const result = await getCustomersPaginated(tenant.id, page, limit, search, includeDeleted);
    return Response.json(result);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const context = await validateAdminApi();

  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenant } = context;

  try {
    const { name, email, phoneNumber } = await request.json();

    if (!name || !phoneNumber) {
      return Response.json({ error: "Nome e Telefone são obrigatórios" }, { status: 400 });
    }

    const customer = await createCustomer(tenant.id, { name, email, phoneNumber });
    return Response.json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
