import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import { ExportCustomerUseCase } from "@/lib/application/use-cases/gdpr/export-customer.use-case";
import { EraseCustomerUseCase } from "@/lib/application/use-cases/gdpr/erase-customer.use-case";

/**
 * GDPR/LGPD endpoint per customer.
 *
 *   GET     → JSON export of every personal data point we hold.
 *   DELETE  → anonymise the customer record in place. Orders/ledger
 *             remain (legal accounting basis); identifying columns are
 *             scrubbed.
 */

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminApi(async () => {
    const { id } = await params;
    const useCase = container.resolve(ExportCustomerUseCase);
    const data = await useCase.execute(id);
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="customer-${id}-export.json"`,
      },
    });
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminApi(async ({ session, tenant }) => {
    const { id } = await params;
    const useCase = container.resolve(EraseCustomerUseCase);
    await useCase.execute({
      customerId: id,
      actorUserId: session.userId,
      tenantId: tenant.id,
    });
    return ApiResponse.ok({ erased: true });
  });
}
