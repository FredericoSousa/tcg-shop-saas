import { NextRequest } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { GetCustomerCreditHistoryUseCase } from "@/lib/application/use-cases/get-customer-credit-history.use-case";
import { withAdminApi } from "@/lib/tenant-server";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminApi(async () => {
    try {
      const { id } = await params;
      const useCase = container.resolve(GetCustomerCreditHistoryUseCase);
      const history = await useCase.execute({ customerId: id });
      
      return ApiResponse.success(history);
    } catch (error: any) {
      return ApiResponse.badRequest(error.message);
    }
  });
}
