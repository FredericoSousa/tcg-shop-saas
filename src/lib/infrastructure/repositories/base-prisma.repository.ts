import { prisma } from "../../prisma";
import { getTenantId } from "../../tenant-context";

export abstract class BasePrismaRepository {
  protected readonly prisma = prisma;

  /**
   * Gets the current tenant ID from the context.
   * Useful for raw SQL queries or specialized logic that prisma hooks don't cover.
   */
  protected get currentTenantId(): string {
    const tenantId = getTenantId();
    if (!tenantId) {
      throw new Error("Tenant context is missing");
    }
    return tenantId;
  }

  /**
   * Utility for centralized error handling or logging.
   */
  protected handleError(error: unknown, operation: string): never {
    console.error(`[Repository Error] ${operation}:`, error);
    // Here we could map Prisma errors to Domain errors (e.g., NotFound, Conflict)
    throw error;
  }
}
