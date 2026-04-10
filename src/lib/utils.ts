import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatPhone as fp } from "./utils/format"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatPhone = fp
export * from "./utils/format"
