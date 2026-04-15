import { NextRequest } from "next/server";
import { getTenant } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { runWithTenant } from "@/lib/tenant-context";
import { SubmitBuylistProposalUseCase } from "@/lib/application/use-cases/submit-buylist-proposal.use-case";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import { logger } from "@/lib/logger";

const submitProposalUseCase = container.resolve(SubmitBuylistProposalUseCase);

export async function POST(request: NextRequest) {
  const tenant = await getTenant();
  if (!tenant) return ApiResponse.badRequest("Tenant não identificado");

  try {
    const { items, customerData } = await request.json();
    
    if (!items || items.length === 0) {
      return ApiResponse.badRequest("Sua lista está vazia");
    }

    if (!customerData || !customerData.phoneNumber) {
      return ApiResponse.badRequest("Dados do cliente são obrigatórios");
    }

    const result = await runWithTenant(tenant.id, () => 
      submitProposalUseCase.execute({
        tenantId: tenant.id,
        customerData,
        items,
      })
    );

    return ApiResponse.success(result);
  } catch (error) {
    logger.error("Error submitting buylist proposal", error as Error, { tenantId: tenant.id });
    return ApiResponse.serverError();
  }
}
