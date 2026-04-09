export const LANGUAGES = {
  PT: { code: "PT", flag: "🇧🇷", label: "Português" },
  EN: { code: "EN", flag: "🇺🇸", label: "Inglês" },
  JP: { code: "JP", flag: "🇯🇵", label: "Japonês" },
  ES: { code: "ES", flag: "🇪🇸", label: "Espanhol" },
  FR: { code: "FR", flag: "🇫🇷", label: "Francês" },
  DE: { code: "DE", flag: "🇩🇪", label: "Alemão" },
  IT: { code: "IT", flag: "🇮🇹", label: "Italiano" },
  KR: { code: "KR", flag: "🇰🇷", label: "Coreano" },
  RU: { code: "RU", flag: "🇷🇺", label: "Russo" },
  ZHS: { code: "ZHS", flag: "🇨🇳", label: "Chinês Simplificado" },
  ZHT: { code: "ZHT", flag: "🇹🇼", label: "Chinês Tradicional" },
  PH: { code: "PH", flag: "🏴", label: "Phyrexiano" },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

export const LANGUAGE_LIST = Object.values(LANGUAGES);

export function getLanguageData(code: string) {
  const upperCode = code.toUpperCase();
  return LANGUAGES[upperCode as LanguageCode] || { code: upperCode, flag: "🏳️", label: code };
}
