import { z } from "zod";

/**
 * Centralized application configuration.
 * Single source of truth for environment variables and constants.
 */

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  JWT_EXPIRATION_TIME: z.string().default("1h"),
  SESSION_COOKIE_MAX_AGE: z.coerce.number().default(60 * 60), // 1h
});

const getEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMsg = Object.entries(errors)
      .map(([field, msgs]) => `${field}: ${msgs?.join(", ")}`)
      .join("\n");

    if (process.env.NODE_ENV === "production" || process.env.STRICT_CONFIG === "true") {
      console.error("❌ Invalid environment variables:\n" + errorMsg);
      throw new Error("Invalid environment variables");
    } else {
      console.warn("⚠️ Warning: Some environment variables are missing or invalid in development:\n" + errorMsg);
    }
  }

  return result.success ? result.data : (process.env as unknown as z.infer<typeof envSchema>);
};

const env = getEnv();

export const config = {
  jwtSecret: new TextEncoder().encode(
    env.JWT_SECRET || "dev-secret-do-not-use-in-production-must-be-long",
  ),
  isProduction: env.NODE_ENV === "production",
  isDevelopment: env.NODE_ENV === "development",
  supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  /** Tempo de vida da sessão JWT. Valor padrão curto (1h) por segurança. */
  jwtExpirationTime: env.JWT_EXPIRATION_TIME,
  /** Duração do cookie de sessão em segundos (deve ser >= ao jwtExpirationTime) */
  sessionCookieMaxAge: env.SESSION_COOKIE_MAX_AGE,
} as const;
