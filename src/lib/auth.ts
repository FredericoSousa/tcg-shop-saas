import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";
import { config } from "./config";

const JWT_SECRET = config.jwtSecret;

export interface SessionData {
  userId: string;
  username: string;
  tenantId: string;
  role: "ADMIN" | "USER";
  /** Issued-at timestamp (seconds). Permite invalidar sessões emitidas antes de um evento (e.g. troca de senha). */
  iat?: number;
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
  const token = await new SignJWT({ ...data, iat: Math.floor(Date.now() / 1000) } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(config.jwtExpirationTime)
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
      maxAge: config.sessionCookieMaxAge,
      path: "/",
    });
  } catch (error) {
    // Ignore errors during build/SSG
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
