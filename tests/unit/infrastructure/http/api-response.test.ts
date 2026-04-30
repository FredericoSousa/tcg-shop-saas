import { describe, it, expect } from "vitest";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import {
  EntityNotFoundError,
  ValidationError,
  UnauthorizedError,
  InsufficientFundsError,
  InsufficientStockError,
  BusinessRuleViolationError,
  ConflictError,
} from "@/lib/domain/errors/domain.error";

async function readBody(res: Response): Promise<{ status: number; body: unknown }> {
  return { status: res.status, body: await res.json() };
}

describe("ApiResponse", () => {
  it("success wraps data with success=true", async () => {
    const { status, body } = await readBody(ApiResponse.success({ id: 1 }, "ok"));
    expect(status).toBe(200);
    expect(body).toMatchObject({ success: true, data: { id: 1 }, message: "ok" });
  });

  it("created returns 201", async () => {
    const { status } = await readBody(ApiResponse.created({}));
    expect(status).toBe(201);
  });

  it("badRequest returns 400 with error details", async () => {
    const { status, body } = await readBody(
      ApiResponse.badRequest("nope", "BAD", { reason: "x" }),
    );
    expect(status).toBe(400);
    expect(body).toMatchObject({ error: { code: "BAD", details: { reason: "x" } } });
  });

  it("unauthorized returns 401", async () => {
    expect((await readBody(ApiResponse.unauthorized())).status).toBe(401);
  });

  it("forbidden returns 403", async () => {
    expect((await readBody(ApiResponse.forbidden())).status).toBe(403);
  });

  it("notFound returns 404", async () => {
    expect((await readBody(ApiResponse.notFound())).status).toBe(404);
  });

  it("serverError returns 500", async () => {
    expect((await readBody(ApiResponse.serverError())).status).toBe(500);
  });
});

describe("ApiResponse.fromError", () => {
  it("maps EntityNotFoundError to 404", async () => {
    const r = await readBody(
      ApiResponse.fromError(new EntityNotFoundError("Order", "x")),
    );
    expect(r.status).toBe(404);
  });

  it("maps ValidationError to 400 and preserves details", async () => {
    const err = new ValidationError("bad", { field: "x" });
    const r = await readBody(ApiResponse.fromError(err));
    expect(r.status).toBe(400);
    expect((r.body as { error: { details: unknown } }).error.details).toEqual({ field: "x" });
  });

  it("maps UnauthorizedError to 401", async () => {
    const r = await readBody(ApiResponse.fromError(new UnauthorizedError()));
    expect(r.status).toBe(401);
  });

  it("maps InsufficientFundsError to 400", async () => {
    const r = await readBody(ApiResponse.fromError(new InsufficientFundsError()));
    expect(r.status).toBe(400);
  });

  it("maps InsufficientStockError to 409", async () => {
    const r = await readBody(ApiResponse.fromError(new InsufficientStockError("inv-1")));
    expect(r.status).toBe(409);
  });

  it("maps BusinessRuleViolationError to 422", async () => {
    const r = await readBody(
      ApiResponse.fromError(new BusinessRuleViolationError("nope")),
    );
    expect(r.status).toBe(422);
  });

  it("maps ConflictError to 409", async () => {
    const r = await readBody(ApiResponse.fromError(new ConflictError("dup")));
    expect(r.status).toBe(409);
  });

  it("falls back to 500 for unknown errors", async () => {
    const r = await readBody(ApiResponse.fromError(new Error("boom")));
    expect(r.status).toBe(500);
    expect((r.body as { message: string }).message).toBe("boom");
  });
});
