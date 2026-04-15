import { NextRequest } from "next/server";
import { getTenant } from "@/lib/tenant-server";
import { getSession } from "@/lib/auth";
import { container } from "@/lib/infrastructure/container";
import { SubmitBuylistProposalUseCase } from "@/lib/application/use-cases/submit-buylist-proposal.use-case";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import { logger } from "@/lib/logger";

const submitProposalUseCase = container.resolve(SubmitBuylistProposalUseCase);

export async function POST(request: NextRequest) {
  const tenant = await getTenant();
  if (!tenant) return ApiResponse.badRequest("Tenant não identificado");

  const session = await getSession();
  // We allow submission only for logged in customers
  if (!session || !session.userId) {
    return ApiResponse.unauthorized("Você precisa estar logado para enviar uma proposta");
  }

  try {
    const body = await request.json();
    const result = await submitProposalUseCase.execute({
      tenantId: tenant.id,
      customerId: session.userId, // Assuming userId is the customerId in this context
      items: body.items,
    });

    return ApiResponse.success(result);
  } catch (error) {
    logger.error("Error submitting buylist proposal", error as Error, { tenantId: tenant.id });
    return ApiResponse.serverError();
  }
}
