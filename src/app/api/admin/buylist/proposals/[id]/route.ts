import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ProcessBuylistProposalUseCase } from "@/lib/application/use-cases/process-buylist-proposal.use-case";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import { logger } from "@/lib/logger";

const processProposalUseCase = container.resolve(ProcessBuylistProposalUseCase);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const body = await request.json();
      const proposalId = (await params).id;
      
      await processProposalUseCase.execute({
        proposalId,
        ...body
      });

      return ApiResponse.success({ message: "Proposta processada com sucesso" });
    } catch (error) {
      logger.error("Error processing buylist proposal", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
    }
  });
}
