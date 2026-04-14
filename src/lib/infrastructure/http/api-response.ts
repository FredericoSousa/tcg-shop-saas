import { NextResponse } from "next/server";
import { 
  DomainError, 
  EntityNotFoundError, 
  ValidationError, 
  UnauthorizedError, 
  InsufficientFundsError, 
  ConflictError 
} from "@/lib/domain/errors/domain.error";

export interface ApiResponseData<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    details?: unknown;
  };
  meta?: {
    [key: string]: unknown;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export class ApiResponse {
  static json<T>(data: ApiResponseData<T>, status: number = 200) {
    return NextResponse.json(data, { status });
  }

  static success<T>(data?: T, message?: string, meta?: Record<string, unknown>) {
    return this.json({
      success: true,
      data,
      message,
      meta,
    });
  }

  static created<T>(data?: T, message: string = "Created successfully") {
    return this.json({
      success: true,
      data,
      message,
    }, 201);
  }

  static ok<T>(data?: T, message?: string) {
    return this.success(data, message);
  }

  static badRequest(message: string, code: string = "BAD_REQUEST", details?: unknown) {
    return this.json({
      success: false,
      message,
      error: { code, details },
    }, 400);
  }

  static unauthorized(message: string = "Unauthorized", code: string = "UNAUTHORIZED") {
    return this.json({
      success: false,
      message,
      error: { code },
    }, 401);
  }

  static forbidden(message: string = "Forbidden", code: string = "FORBIDDEN") {
    return this.json({
      success: false,
      message,
      error: { code },
    }, 403);
  }

  static notFound(message: string = "Resource not found", code: string = "NOT_FOUND") {
    return this.json({
      success: false,
      message,
      error: { code },
    }, 404);
  }

  static serverError(message: string = "Internal Server Error", code: string = "INTERNAL_SERVER_ERROR", details?: unknown) {
    return this.json({
      success: false,
      message,
      error: { code, details },
    }, 500);
  }

  static fromError(error: unknown) {
    if (error instanceof DomainError) {
      if (error instanceof EntityNotFoundError) {
        return this.notFound(error.message, error.code);
      }
      if (error instanceof ValidationError) {
        return this.badRequest(error.message, error.code, error.details);
      }
      if (error instanceof UnauthorizedError) {
        return this.unauthorized(error.message, error.code);
      }
      if (error instanceof InsufficientFundsError) {
        return this.badRequest(error.message, error.code);
      }
      if (error instanceof ConflictError) {
        return this.json({ success: false, message: error.message, error: { code: error.code } }, 409);
      }
      
      return this.badRequest(error.message, error.code);
    }

    const err = error as Error;
    return this.serverError(err.message || "Ocorreu um erro inesperado.");
  }
}
