import { Prisma } from "@prisma/client";

type Decimal = Prisma.Decimal;

/**
 * Formats a string to Brazilian phone pattern (XX) XXXXX-XXXX or (XX) XXXX-XXXX
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, "");
  
  // Limit to 11 digits
  const numbers = cleaned.slice(0, 11);
  const length = numbers.length;
  
  if (length <= 2) {
    return numbers;
  }
  if (length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }
  if (length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

/**
 * Removes all non-numeric characters from a string
 */
export function unmaskPhone(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Formats a number to Brazilian currency (R$ XX,XX)
 */
export function formatCurrency(
  value: number | string | Decimal | null | undefined,
  options: Intl.NumberFormatOptions = {}
): string {
  if (value === null || value === undefined) return "R$ 0,00";
  
  let numValue: number;
  
  if (typeof value === "string") {
    numValue = parseFloat(value);
  } else if (value && typeof value === "object" && "toNumber" in value && typeof (value as unknown as { toNumber: unknown }).toNumber === "function") {
    numValue = (value as unknown as { toNumber: () => number }).toNumber();
  } else {
    numValue = value as number;
  }
  
  if (isNaN(numValue)) return "R$ 0,00";
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    ...options,
  }).format(numValue);
}

/**
 * Parses a currency string (like "R$ 1.234,56") back to a number
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  
  // Remove "R$", dots (thousands separator), and replace comma with dot
  const cleaned = value
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
    
  const result = parseFloat(cleaned);
  return isNaN(result) ? 0 : result;
}

/**
 * Formats a decimal number (like 1234.56) to Brazilian pattern (1.234,56)
 */
export function formatDecimal(value: number | string | Decimal | null | undefined): string {
  if (value === null || value === undefined) return "0,00";
  
  let numValue: number;
  
  if (typeof value === "string") {
    numValue = parseFloat(value);
  } else if (value && typeof value === "object" && "toNumber" in value && typeof (value as unknown as { toNumber: unknown }).toNumber === "function") {
    numValue = (value as unknown as { toNumber: () => number }).toNumber();
  } else {
    numValue = value as number;
  }
  
  if (isNaN(numValue)) return "0,00";
  
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}
