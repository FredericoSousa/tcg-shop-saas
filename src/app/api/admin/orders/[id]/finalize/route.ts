import { NextResponse } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { FinalizeOrderUseCase } from "@/lib/application/use-cases/finalize-order.use-case";
import { runWithTenant } from "@/lib/tenant-context";
import { validateAdminApi } from "@/lib/tenant-server";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await validateAdminApi();
    if (!context) return ApiResponse.unauthorized();
    const { tenant } = context;

    const { id } = await params;
    const body = await request.json();
    const useCase = container.resolve(FinalizeOrderUseCase);

    const result = await runWithTenant(tenant.id, () => useCase.execute({
      orderId: id,
      payments: body.payments,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error finalizing order:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
