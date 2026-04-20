import { z } from "zod";

/**
 * Reusable Zod schemas for API route input validation.
 */

// Password policy: min 10 chars, at least one uppercase, one lowercase, one digit, one symbol.
export const passwordSchema = z
  .string()
  .min(10, "Senha deve ter no mínimo 10 caracteres")
  .max(128, "Senha deve ter no máximo 128 caracteres")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/\d/, "Senha deve conter pelo menos um número")
  .regex(/[^A-Za-z0-9]/, "Senha deve conter pelo menos um símbolo");

// User creation/update payload
export const saveUserSchema = z.object({
  id: z.string().uuid().optional(),
  username: z.string().min(3, "Usuário deve ter no mínimo 3 caracteres").max(64),
  password: passwordSchema.optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
});

// Common pagination params
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Search + pagination (used by most list endpoints)
export const searchPaginationSchema = paginationSchema.extend({
  search: z.string().optional(),
});

// Orders list filters
export const ordersQuerySchema = searchPaginationSchema.extend({
  source: z.enum(["POS", "ECOMMERCE", "all"]).default("all"),
  status: z.enum(["PENDING", "PAID", "SHIPPED", "CANCELLED", "all"]).default("all"),
  customerPhone: z.string().optional(),
});

// Products list filters
export const productsQuerySchema = searchPaginationSchema.extend({
  categoryId: z.string().uuid().optional(),
});

// Customers list filters
export const customersQuerySchema = searchPaginationSchema.extend({
  includeDeleted: z.coerce.boolean().default(false),
});

// Customer creation
export const createCustomerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phoneNumber: z.string().min(1, "Telefone é obrigatório"),
});

// Product creation/update
export const saveProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Preço deve ser positivo"),
  stock: z.coerce.number().int().min(0).default(0),
  categoryId: z.string().uuid("Categoria inválida"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  active: z.boolean().default(true),
  allowNegativeStock: z.boolean().default(false),
});

/**
 * Helper to parse URLSearchParams with a Zod schema.
 * Returns parsed data or throws a ValidationError-compatible object.
 */
export function parseSearchParams<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T,
): z.infer<T> {
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  return schema.parse(raw);
}
