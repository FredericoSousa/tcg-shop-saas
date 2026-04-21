import * as React from "react"

import { LanguageBadge as BadgeLanguageBadge } from "@/components/ui/badge"

interface LegacyLanguageBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  language: string
  showCode?: boolean
}

/**
 * @deprecated Import `LanguageBadge` from `@/components/ui/badge` and rename `language`→`code`.
 */
export function LanguageBadge({
  language,
  showCode = true,
  className,
  ...props
}: LegacyLanguageBadgeProps) {
  return (
    <BadgeLanguageBadge
      code={language}
      showCode={showCode}
      className={className}
      {...props}
    />
  )
}
