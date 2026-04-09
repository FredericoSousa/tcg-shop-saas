import * as React from "react"
import { cn } from "@/lib/utils"
import { getLanguageData } from "@/lib/constants/languages"

interface LanguageBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  language: string
  showCode?: boolean
}

export function LanguageBadge({
  language,
  showCode = true,
  className,
  ...props
}: LanguageBadgeProps) {
  const lang = getLanguageData(language)

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
