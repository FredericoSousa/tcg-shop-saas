export const CONDITION_LABELS = {
  NM: "Near Mint",
  SP: "Slightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  D: "Damaged",
} as const;

export const CONDITION_OPTIONS = [
  { value: "NM", label: "Near Mint (NM)", color: "text-emerald-500", detail: "Impecável" },
  { value: "SP", label: "Slightly Played (SP)", color: "text-blue-500", detail: "Sinais leves" },
  { value: "MP", label: "Moderately Played (MP)", color: "text-amber-500", detail: "Sinais visíveis" },
  { value: "HP", label: "Heavily Played (HP)", color: "text-orange-500", detail: "Muito usado" },
  { value: "D", label: "Damaged (D)", color: "text-destructive", detail: "Danificado" },
] as const;

export type CardCondition = keyof typeof CONDITION_LABELS;
