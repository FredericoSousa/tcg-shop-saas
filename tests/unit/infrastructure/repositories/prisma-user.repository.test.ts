import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { PrismaClient } from "@prisma/client";
import { PrismaUserRepository } from "@/lib/infrastructure/repositories/prisma-user.repository";

// Mock the prisma dependency
vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma as prismaMock } from "@/lib/prisma";

describe("PrismaUserRepository", () => {
  let repository: PrismaUserRepository;

  beforeEach(() => {
    mockReset(prismaMock);
    repository = new PrismaUserRepository();
  });

  it("should find a user by username", async () => {
    const mockUser = {
      id: "user_1",
      username: "admin",
      passwordHash: "hash",
      role: "ADMIN",
    };

    (prismaMock.user.findFirst as any).mockResolvedValue(mockUser);

    const result = await repository.findByUsername("admin");

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: { username: "admin" }
    });
    expect(result?.username).toBe("admin");
    expect(result?.role).toBe("ADMIN");
  });

  it("should find paginated users with search", async () => {
    (prismaMock.user.findMany as any).mockResolvedValue([]);
    (prismaMock.user.count as any).mockResolvedValue(0);

    await repository.findPaginated(1, 10, "test");

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { username: { contains: "test", mode: "insensitive" } },
      skip: 0,
      take: 10
    }));
  });

  it("should create a new user", async () => {
    const userData = {
      username: "newuser",
      passwordHash: "hash",
      role: "STAFF" as any
    };

    (prismaMock.user.create as any).mockResolvedValue({
      ...userData,
      id: "user_new"
    });

    const result = await repository.save(userData as any);

    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(result.id).toBe("user_new");
  });

  it("should find a user by id", async () => {
    (prismaMock.user.findFirst as any).mockResolvedValue({ id: "u1", username: "u1", role: "ADMIN" });
    const result = await repository.findById("u1");
    expect(result?.username).toBe("u1");
  });

  it("should return null if user not found by id", async () => {
    (prismaMock.user.findFirst as any).mockResolvedValue(null);
    const result = await repository.findById("non_existent");
    expect(result).toBeNull();
  });

  it("should return null if user not found by username", async () => {
    (prismaMock.user.findFirst as any).mockResolvedValue(null);
    const result = await repository.findByUsername("non_existent");
    expect(result).toBeNull();
  });

  it("should find all users", async () => {
    (prismaMock.user.findMany as any).mockResolvedValue([{ id: "u1", username: "u1", role: "ADMIN" }]);
    const results = await repository.findAll();
    expect(results).toHaveLength(1);
    expect(results[0].username).toBe("u1");
  });

  it("should find paginated users without search", async () => {
    (prismaMock.user.findMany as any).mockResolvedValue([]);
    (prismaMock.user.count as any).mockResolvedValue(0);
    await repository.findPaginated(1, 10);
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it("should update a user", async () => {
    (prismaMock.user.update as any).mockResolvedValue({ id: "u1", username: "updated", role: "ADMIN" });
    const result = await repository.update("u1", { username: "updated" });
    expect(result.username).toBe("updated");
  });

  it("should delete a user", async () => {
    await repository.delete("user_1");

    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { id: "user_1" }
    });
  });
});
