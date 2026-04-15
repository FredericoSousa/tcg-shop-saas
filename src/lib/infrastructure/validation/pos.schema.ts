import { z } from "zod";

/**
 * Schema for POS Checkout request
 */
export const posCheckoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid("ID de produto inválido"),
      quantity: z.number().int().positive("A quantidade deve ser positiva"),
      price: z.number().positive("O preço deve ser positivo"),
    })
  ).min(1, "O carrinho não pode estar vazio"),
  customerData: z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2).optional(),
    phoneNumber: z.string().min(8).optional(),
  }).refine(data => data.id || data.phoneNumber, {
    message: "ID do cliente ou número de telefone é obrigatório",
    path: ["customerData"]
  }),
});

export type POSCheckoutInput = z.infer<typeof posCheckoutSchema>;

/**
 * Schema for In-Progress Order lookup
 */
export const posInProgressOrderSchema = z.object({
  customerId: z.string().uuid("ID de cliente inválido"),
});

export type POSInProgressOrderInput = z.infer<typeof posInProgressOrderSchema>;
