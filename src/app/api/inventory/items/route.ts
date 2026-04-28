import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { validateAdminApi } from "@/lib/tenant-server";
import { runWithTenant } from "@/lib/tenant-context";
import { container } from "@/lib/infrastructure/container";
import { AddInventoryUseCase } from "@/lib/application/use-cases/inventory/add-inventory.use-case";
import { UpdateInventoryUseCase } from "@/lib/application/use-cases/inventory/update-inventory.use-case";
import { BulkUpdateInventoryUseCase } from "@/lib/application/use-cases/inventory/bulk-update-inventory.use-case";
import { DeleteInventoryUseCase } from "@/lib/application/use-cases/inventory/delete-inventory.use-case";
import { logger } from "@/lib/logger";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

const addInventoryUseCase = container.resolve(AddInventoryUseCase);
const updateInventoryUseCase = container.resolve(UpdateInventoryUseCase);
const bulkUpdateInventoryUseCase = container.resolve(BulkUpdateInventoryUseCase);
const deleteInventoryUseCase = container.resolve(DeleteInventoryUseCase);

/**
 * @openapi
 * /api/inventory/items:
 *   post:
 *     summary: Add inventory item
 *     description: Adds a new item to the inventory. Requires admin authentication.
 *     tags: [Inventory]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scryfallId, price, quantity, condition, language]
 *             properties:
 *               scryfallId: { type: string }
 *               price: { type: number }
 *               quantity: { type: number }
 *               condition: { type: string }
 *               language: { type: string }
 *               extras: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete inventory items
 *     description: Deletes multiple items from the inventory. Requires admin authentication.
 *     tags: [Inventory]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Success
 *   patch:
 *     summary: Update inventory items
 *     description: Updates one or more items in the inventory. Requires admin authentication.
 *     tags: [Inventory]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: { type: string }
 *               ids: { type: array, items: { type: string } }
 *               price: { type: number }
 *               quantity: { type: number }
 *     responses:
 *       200:
 *         description: Success
 */
export async function POST(request: NextRequest) {
  const context = await validateAdminApi();
  if (!context) return ApiResponse.unauthorized();

  const { tenant } = context;

  try {
    const { scryfallId, price, quantity, condition, language, extras = [], allowNegativeStock = false } = await request.json();

    await runWithTenant(tenant.id, () => addInventoryUseCase.execute({
      scryfallId,
      price: Number(price),
      quantity: Number(quantity),
      condition,
      language,
      extras,
      allowNegativeStock,
    }));

    revalidatePath("/admin/inventory");
    return ApiResponse.success({ success: true });
  } catch (error) {
    logger.error("Error adding inventory item", error as Error, {
      tenantId: tenant.id,
      action: "add_inventory",
    });
    return ApiResponse.serverError(error instanceof Error ? error.message : "Internal server error");
  }
}

export async function DELETE(request: NextRequest) {
  const context = await validateAdminApi();
  if (!context) return ApiResponse.unauthorized();

  const { tenant } = context;

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || !ids.length) {
      return ApiResponse.badRequest("No items selected");
    }

    await runWithTenant(tenant.id, () => deleteInventoryUseCase.execute({ ids }));

    revalidatePath("/admin/inventory");
    return ApiResponse.success({ success: true });
  } catch (error) {
    logger.error("Error deleting inventory items", error as Error, {
      tenantId: tenant.id,
      action: "delete_inventory",
    });
    return ApiResponse.serverError();
  }
}

export async function PATCH(request: NextRequest) {
  const context = await validateAdminApi();
  if (!context) return ApiResponse.unauthorized();

  const { tenant } = context;

  try {
    const { id, ids, price, quantity } = await request.json();

    if (ids && Array.isArray(ids)) {
      await runWithTenant(tenant.id, () => bulkUpdateInventoryUseCase.execute({
        ids,
        price: price !== undefined ? Number(price) : undefined,
        quantity: quantity !== undefined ? Number(quantity) : undefined,
      }));
    } else if (id) {
      await runWithTenant(tenant.id, () => updateInventoryUseCase.execute({
        id,
        price: price !== undefined ? Number(price) : undefined,
        quantity: quantity !== undefined ? Number(quantity) : undefined,
      }));
    } else {
      return ApiResponse.badRequest("Invalid data");
    }

    revalidatePath("/admin/inventory");
    return ApiResponse.success({ success: true });
  } catch (error) {
    logger.error("Error updating inventory items", error as Error, {
      tenantId: tenant.id,
      action: "update_inventory",
    });
    return ApiResponse.serverError();
  }
}
