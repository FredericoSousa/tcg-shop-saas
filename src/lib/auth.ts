import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

// Secret key for JWT - MUST be set in environment variables
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is not set!");
  } else {
    console.warn("WARNING: JWT_SECRET environment variable is not set. Using insecure fallback for development.");
  }
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-do-not-use-in-production",
);

export interface SessionData {
  userId: string;
  username: string;
  tenantId: string;
  role: "ADMIN" | "USER";
}

/**
 * Hash a password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

/**
 * Compare a password with its hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return compare(password, hash);
}

/**
 * Create a session token
 */
export async function createSessionToken(data: SessionData): Promise<string> {
  const token = await new SignJWT(data as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
  return token;
}

/**
 * Verify and decode a session token
 */
export async function verifySessionToken(
  token: string,
): Promise<SessionData | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as SessionData;
  } catch {
    return null;
  }
}

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) return null;

    return verifySessionToken(token);
  } catch (error) {
    return null;
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
  } catch (error) {
    // Ignore errors during build/SSD
  }
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session");
  } catch (error) {
    // Ignore errors during build/SSD
  }
}

/**
 * Authenticate user with username and password for a tenant
 */
export async function authenticateUser(
  username: string,
  password: string,
  tenantId: string,
): Promise<SessionData | null> {
  const user = await prisma.user.findUnique({
    where: {
      username_tenantId: {
        username,
        tenantId,
      },
    },
  });

  if (!user) return null;

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) return null;

  return {
    userId: user.id,
    username: user.username,
    tenantId: user.tenantId,
    role: user.role as "ADMIN" | "USER",
  };
}

/**
 * Create a new user
 */
export async function createUser(
  username: string,
  password: string,
  tenantId: string,
  role: "ADMIN" | "USER" = "USER",
) {
  const hashedPassword = await hashPassword(password);

  return prisma.user.create({
    data: {
      username,
      passwordHash: hashedPassword,
      tenantId,
      role,
    },
  });
}
