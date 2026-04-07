import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { validateAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { AddInventoryUseCase } from "@/lib/application/use-cases/add-inventory.use-case";
import { UpdateInventoryUseCase } from "@/lib/application/use-cases/update-inventory.use-case";
import { DeleteInventoryUseCase } from "@/lib/application/use-cases/delete-inventory.use-case";
import { logger } from "@/lib/logger";

const addInventoryUseCase = container.resolve(AddInventoryUseCase);
const updateInventoryUseCase = container.resolve(UpdateInventoryUseCase);
const deleteInventoryUseCase = container.resolve(DeleteInventoryUseCase);

export async function POST(request: NextRequest) {
  const context = await validateAdminApi();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    const { scryfallId, price, quantity, condition, language, extras = [] } = await request.json();

    await addInventoryUseCase.execute({
      tenantId: tenant.id,
      scryfallId,
      price: Number(price),
      quantity: Number(quantity),
      condition,
      language,
      extras,
    });

    revalidatePath("/admin/inventory");
    return Response.json({ success: true });
  } catch (error) {
    logger.error("Error adding inventory item", error as Error, {
      tenantId: tenant.id,
      action: "add_inventory",
    });
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const context = await validateAdminApi();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || !ids.length) {
      return Response.json({ error: "No items selected" }, { status: 400 });
    }

    await deleteInventoryUseCase.execute({ ids, tenantId: tenant.id });

    revalidatePath("/admin/inventory");
    return Response.json({ success: true });
  } catch (error) {
    logger.error("Error deleting inventory items", error as Error, {
      tenantId: tenant.id,
      action: "delete_inventory",
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const context = await validateAdminApi();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    const { id, price, quantity } = await request.json();

    if (!id || (price === undefined && quantity === undefined)) {
      return Response.json({ error: "Invalid data" }, { status: 400 });
    }

    await updateInventoryUseCase.execute({
      id,
      tenantId: tenant.id,
      price: price !== undefined ? Number(price) : undefined,
      quantity: quantity !== undefined ? Number(quantity) : undefined,
    });

    revalidatePath("/admin/inventory");
    return Response.json({ success: true });
  } catch (error) {
    logger.error("Error updating inventory item", error as Error, {
      tenantId: tenant.id,
      action: "update_inventory",
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
