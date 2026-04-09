import { NextResponse } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { FinalizeOrderUseCase } from "@/lib/application/use-cases/finalize-order.use-case";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const useCase = container.resolve(FinalizeOrderUseCase);

    const result = await useCase.execute({
      orderId: id,
      payments: body.payments,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error finalizing order:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 400 }
    );
  }
}
