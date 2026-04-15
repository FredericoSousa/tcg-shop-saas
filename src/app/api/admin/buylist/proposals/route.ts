import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListBuylistProposalsUseCase } from "@/lib/application/use-cases/list-buylist-proposals.use-case";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import { logger } from "@/lib/logger";

const listProposalsUseCase = container.resolve(ListBuylistProposalsUseCase);

export async function GET() {
  return withAdminApi(async ({ tenant }) => {
    try {
      const proposals = await listProposalsUseCase.execute(tenant.id);
      return ApiResponse.success(proposals);
    } catch (error) {
      logger.error("Error fetching buylist proposals", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
    }
  });
}
