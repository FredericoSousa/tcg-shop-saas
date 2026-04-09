import "reflect-metadata";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { container } from "./lib/infrastructure/container";
import { GetTenantUseCase } from "./lib/application/use-cases/get-tenant.use-case";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production",
);

// Routes that require authentication
const PROTECTED_ROUTES = ["/admin"];

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;
  const hostname = request.headers.get("host") || "";
  const token = request.cookies.get("session")?.value;

  // Check if route requires protection
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  // If it's a protected route, verify token
  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // If user is logged in and tries to access login page, redirect to admin
  if (pathname === "/login") {
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL("/admin", request.url));
      } catch {
        // Token is invalid, allow access to login page
      }
    }
  }

  // Multi-tenant subdomain routing
  const subdomain = hostname.split(".")[0];
  console.log(`[Proxy] hostname: ${hostname}, subdomain: ${subdomain}, pathname: ${pathname}`);

  if (
    !subdomain ||
    subdomain === "www" ||
    subdomain === "localhost" ||
    subdomain.includes(":")
  ) {
    console.log(`[Proxy] Skipping tenant lookup for subdomain: ${subdomain}`);
    return NextResponse.next();
  }

  try {
    const getTenantUseCase = container.resolve(GetTenantUseCase);
    const tenantRes = await getTenantUseCase.execute({ slug: subdomain });

    if (tenantRes && tenantRes.id) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-tenant-id", tenantRes.id);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  } catch (err) {
    console.error("Proxy tenant lookup error:", err);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
