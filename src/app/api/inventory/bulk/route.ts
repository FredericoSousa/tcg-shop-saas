import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { logger, createTimer } from "@/lib/logger";
import { validateAdminApi } from "@/lib/tenant-server";
import { runWithTenant } from "@/lib/tenant-context";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import { container } from "@/lib/infrastructure/container";
import { AddBulkInventoryUseCase, AddBulkInventoryRequest, BulkInventoryResult } from "@/lib/application/use-cases/inventory/add-bulk-inventory.use-case";

/**
 * @openapi
 * /api/inventory/bulk:
 *   post:
 *     summary: Add bulk inventory items
 *     description: Adds multiple items to the inventory at once. Requires admin authentication.
 *     tags: [Inventory]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required: [scryfallId, quantity, condition, language, price]
 *               properties:
 *                 scryfallId: { type: string }
 *                 quantity: { type: number }
 *                 condition: { type: string }
 *                 language: { type: string }
 *                 price: { type: number }
 *                 extras: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Results of the bulk operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export async function POST(request: NextRequest) {
  const timer = createTimer("addBulkInventoryItems");
  const context = await validateAdminApi();

  if (!context) {
    return ApiResponse.unauthorized("Ação não autorizada. Escopo restrito do Lojista.");
  }

  try {
    const items: AddBulkInventoryRequest = await request.json();

    if (!Array.isArray(items) || !items.length) {
      return ApiResponse.badRequest("No items to add");
    }

    const { tenant } = context;

    const useCase = container.resolve(AddBulkInventoryUseCase);
    const results = await runWithTenant(tenant.id, () => useCase.execute(items));

    revalidatePath("/admin/inventory");
    
    const successCount = results.filter((r: BulkInventoryResult) => r.status === "success").length;
    logger.info("Bulk inventory items added successfully", {
      action: "add_bulk_inventory",
      itemsCount: items.length,
      successCount,
    });

    return ApiResponse.success(results);
  } catch (error) {
    logger.error(
      "Error adding bulk inventory items",
      error instanceof Error ? error : new Error(String(error)),
      {
        action: "add_bulk_inventory",
      },
    );
    return ApiResponse.serverError("Internal server error");
  } finally {
    timer.log({ action: "add_bulk_inventory" });
  }
}
