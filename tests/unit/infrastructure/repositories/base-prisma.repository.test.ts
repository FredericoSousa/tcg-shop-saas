import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient, Prisma } from "@prisma/client";
import { BasePrismaRepository } from "@/lib/infrastructure/repositories/base-prisma.repository";
import { tenantContext } from "@/lib/tenant-context";

// Mock the prisma dependency
vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma as prismaMock } from "@/lib/prisma";

// Dummy implementation for testing abstract class
class TestRepository extends BasePrismaRepository {
  public getTenantId() {
    return this.currentTenantId;
  }
}

describe("BasePrismaRepository", () => {
  let repository: TestRepository;

  beforeEach(() => {
    mockReset(prismaMock);
    repository = new TestRepository();
  });

  it("should return the tenant id from context store", () => {
    vi.spyOn(tenantContext, "getStore").mockReturnValue("tenant_abc");
    expect(repository.getTenantId()).toBe("tenant_abc");
  });

  it("should throw error if tenant context is missing", () => {
    vi.spyOn(tenantContext, "getStore").mockReturnValue(undefined);
    expect(() => repository.getTenantId()).toThrow("Tenant context is missing");
  });

  describe("mapPrismaError", () => {
    it("should map P2002 to ConflictError", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Conflict", {
        code: "P2002",
        clientVersion: "7.6.0",
      });
      expect(() => (repository as any).mapPrismaError(error)).toThrow("Já existe um registro com estes dados.");
    });

    it("should map P2025 to EntityNotFoundError", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "7.6.0",
      });
      expect(() => (repository as any).mapPrismaError(error)).toThrow("Registro with ID unknown not found");
    });

    it("should rethrow other Prisma errors", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Other", {
        code: "P9999",
        clientVersion: "7.6.0",
      });
      expect(() => (repository as any).mapPrismaError(error)).toThrow(error);
    });

    it("should rethrow unknown errors", () => {
      const error = new Error("Unknown error");
      expect(() => (repository as any).mapPrismaError(error)).toThrow("Unknown error");
    });
  });

  describe("handleError", () => {
    it("should log error and call mapPrismaError", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("Test error");
      expect(() => (repository as any).handleError(error, "testOperation")).toThrow("Test error");
      expect(consoleSpy).toHaveBeenCalledWith("[Repository Error] testOperation:", error);
    });
  });
});
