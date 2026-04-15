import { NextRequest } from "next/server";
import { getTenant } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { runWithTenant } from "@/lib/tenant-context";
import { GetBuylistProposalUseCase } from "@/lib/application/use-cases/get-buylist-proposal.use-case";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import { logger } from "@/lib/logger";

const getProposalUseCase = container.resolve(GetBuylistProposalUseCase);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenant = await getTenant();
  if (!tenant) return ApiResponse.unauthorized();

  const { id } = await params;

  try {
    const result = await runWithTenant(tenant.id, () => 
      getProposalUseCase.execute(id)
    );

    return ApiResponse.success(result);
  } catch (error) {
    logger.error("Error fetching buylist proposal", error as Error, { tenantId: tenant.id, proposalId: id });
    return ApiResponse.fromError(error);
  }
}
