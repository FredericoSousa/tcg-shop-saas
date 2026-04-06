import * as React from "react"
import { cn } from "@/lib/utils"

interface LanguageBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  language: string
  showCode?: boolean
}

const languageMap: Record<string, { flag: string; label: string }> = {
  PT: { flag: "🇧🇷", label: "Português" },
  EN: { flag: "🇺🇸", label: "Inglês" },
  JP: { flag: "🇯🇵", label: "Japonês" },
  ES: { flag: "🇪🇸", label: "Espanhol" },
  FR: { flag: "🇫🇷", label: "Francês" },
  DE: { flag: "🇩🇪", label: "Alemão" },
  IT: { flag: "🇮🇹", label: "Italiano" },
  KR: { flag: "🇰🇷", label: "Coreano" },
  RU: { flag: "🇷🇺", label: "Russo" },
  CN: { flag: "🇨🇳", label: "Chinês" },
}

export function LanguageBadge({
  language,
  showCode = true,
  className,
  ...props
}: LanguageBadgeProps) {
  const lang = languageMap[language.toUpperCase()] || { flag: "🏳️", label: language }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted border border-border shadow-sm tabular-nums whitespace-nowrap",
        className
      )}
      title={lang.label}
      {...props}
    >
      <span className="text-xs leading-none">{lang.flag}</span>
      {showCode && <span>{language.toUpperCase()}</span>}
    </span>
  )
}
