import { z } from "zod";

/**
 * Centralized application configuration.
 * Single source of truth for environment variables and constants.
 */

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
    REDIS_URL: z.string().url().optional(),
    CACHE_STORE: z.enum(["memory", "redis"]).default("memory"),
    SENTRY_DSN: z.string().url().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  })
  .superRefine((data, ctx) => {
    const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
    if (data.NODE_ENV === "production" && !isBuildPhase) {
      if (data.CACHE_STORE !== "redis" || !data.REDIS_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["REDIS_URL"],
          message:
            "Redis é obrigatório em produção. Defina CACHE_STORE=redis e REDIS_URL.",
        });
      }
    }
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
  isProduction: env.NODE_ENV === "production",
  isDevelopment: env.NODE_ENV === "development",
  supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  cache: {
    store: env.CACHE_STORE,
    redisUrl: env.REDIS_URL,
  },
  sentry: {
    serverDsn: env.SENTRY_DSN,
    clientDsn: env.NEXT_PUBLIC_SENTRY_DSN,
  },
} as const;
