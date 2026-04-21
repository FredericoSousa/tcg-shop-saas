import { toast } from "sonner";

export interface ApiErrorShape {
  success?: boolean;
  message?: string;
  error?: {
    code?: string;
    details?: unknown;
  };
}

interface ToastFromErrorOptions {
  fallbackTitle?: string;
  context?: string;
}

function extractError(input: unknown): { code?: string; message?: string; details?: unknown } {
  if (!input) return {};
  if (typeof input === "string") return { message: input };
  if (input instanceof Error) return { message: input.message };

  const obj = input as ApiErrorShape;
  return {
    code: obj.error?.code,
    message: obj.message,
    details: obj.error?.details,
  };
}

export function toastFromError(input: unknown, options: ToastFromErrorOptions = {}) {
  const { fallbackTitle = "Algo deu errado", context } = options;
  const { code, message, details } = extractError(input);

  switch (code) {
    case "INSUFFICIENT_STOCK": {
      const remaining =
        details && typeof details === "object" && "remaining" in details
          ? Number((details as { remaining: unknown }).remaining)
          : null;
      toast.warning("Estoque indisponível", {
        description:
          remaining !== null && !Number.isNaN(remaining)
            ? `Apenas ${remaining} unidade(s) restante(s).`
            : message || "Um dos itens não tem estoque suficiente.",
      });
      return;
    }

    case "VALIDATION_ERROR": {
      const fields =
        Array.isArray(details) && details.length > 0
          ? details
              .map((d) => (typeof d === "object" && d && "message" in d ? String((d as { message: unknown }).message) : String(d)))
              .join(", ")
          : null;
      toast.error("Verifique os campos", {
        description: fields || message || "Alguns campos estão inválidos.",
      });
      return;
    }

    case "PAYMENT_DECLINED":
      toast.error("Pagamento recusado", {
        description: message || "Tente outro método ou contate sua operadora.",
        action: {
          label: "Tentar outro método",
          onClick: () => {
            if (typeof window !== "undefined") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          },
        },
      });
      return;

    case "INSUFFICIENT_FUNDS":
      toast.error("Saldo insuficiente", {
        description: message || "Saldo insuficiente para completar a operação.",
      });
      return;

    case "ENTITY_NOT_FOUND":
      toast.error("Não encontrado", {
        description: message || "O item solicitado não existe mais.",
      });
      return;

    case "UNAUTHORIZED":
      toast.error("Sessão expirada", {
        description: message || "Faça login novamente para continuar.",
      });
      return;

    case "CONFLICT":
      toast.warning("Conflito detectado", {
        description: message || "O estado do item mudou. Atualize e tente de novo.",
      });
      return;

    case "BUSINESS_RULE_VIOLATION":
      toast.error("Operação não permitida", {
        description: message || "Essa ação viola uma regra de negócio.",
      });
      return;

    default: {
      const suffix = code ? ` (cód. ${code})` : "";
      toast.error(fallbackTitle, {
        description: `${message || "Erro inesperado. Tente novamente."}${suffix}${context ? ` — ${context}` : ""}`,
      });
    }
  }
}
