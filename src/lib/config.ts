/**
 * Centralized application configuration.
 * Single source of truth for environment variables and constants.
 */

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is not set!");
  } else {
    console.warn("WARNING: JWT_SECRET environment variable is not set. Using insecure fallback for development.");
  }
}

export const config = {
  jwtSecret: new TextEncoder().encode(
    process.env.JWT_SECRET || "dev-secret-do-not-use-in-production",
  ),
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  /** Tempo de vida da sessão JWT. Valor padrão curto (1h) por segurança. */
  jwtExpirationTime: (process.env.JWT_EXPIRATION_TIME || "1h") as string,
  /** Duração do cookie de sessão em segundos (deve ser >= ao jwtExpirationTime) */
  sessionCookieMaxAge: Number(process.env.SESSION_COOKIE_MAX_AGE) || 60 * 60, // 1h
} as const;
