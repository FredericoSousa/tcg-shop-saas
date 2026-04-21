export const CONDITION_LABELS = {
  NM: "Near Mint",
  SP: "Slightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  D: "Damaged",
} as const;

export const CONDITION_OPTIONS = [
  { value: "NM", label: "Near Mint (NM)", color: "text-success", detail: "Impecável" },
  { value: "SP", label: "Slightly Played (SP)", color: "text-info", detail: "Sinais leves" },
  { value: "MP", label: "Moderately Played (MP)", color: "text-warning", detail: "Sinais visíveis" },
  { value: "HP", label: "Heavily Played (HP)", color: "text-warning", detail: "Muito usado" },
  { value: "D", label: "Damaged (D)", color: "text-destructive", detail: "Danificado" },
] as const;

export type CardCondition = keyof typeof CONDITION_LABELS;
