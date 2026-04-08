import { NextResponse } from "next/server";

export interface ApiResponseData<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    details?: any;
  };
  meta?: {
    [key: string]: any;
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

  static success<T>(data?: T, message?: string, meta?: any) {
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

  static badRequest(message: string, code: string = "BAD_REQUEST", details?: any) {
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

  static serverError(message: string = "Internal Server Error", code: string = "INTERNAL_SERVER_ERROR", details?: any) {
    return this.json({
      success: false,
      message,
      error: { code, details },
    }, 500);
  }
}
