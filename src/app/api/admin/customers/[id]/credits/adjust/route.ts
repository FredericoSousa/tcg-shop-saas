import { NextRequest } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { AdjustCustomerCreditUseCase } from "@/lib/application/use-cases/adjust-customer-credit.use-case";
import { withAdminApi } from "@/lib/tenant-server";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminApi(async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      
      const useCase = container.resolve(AdjustCustomerCreditUseCase);
      const result = await useCase.execute({
        customerId: id,
        amount: body.amount,
        description: body.description
      });
      
      return ApiResponse.success(result);
    } catch (error: any) {
      return ApiResponse.badRequest(error.message);
    }
  });
}
