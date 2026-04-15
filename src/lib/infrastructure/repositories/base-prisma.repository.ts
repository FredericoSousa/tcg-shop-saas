import { prisma } from "../../prisma";
import { getTenantId } from "../../tenant-context";
import { Prisma } from "@prisma/client";
import { EntityNotFoundError, ConflictError } from "../../domain/errors/domain.error";

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
    this.mapPrismaError(error);
  }

  /**
   * Maps Prisma-specific errors to Domain-level errors.
   */
  protected mapPrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new ConflictError("Já existe um registro com estes dados.");
      }
      if (error.code === "P2025") {
        throw new EntityNotFoundError("Registro", "unknown");
      }
    }
    throw error;
  }
}
