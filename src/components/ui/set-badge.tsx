"use client"

import { SetBadge as BadgeSetBadge } from "@/components/ui/badge"

interface LegacySetBadgeProps {
  setCode: string
  setName?: string
  className?: string
  iconClassName?: string
  showText?: boolean
  textClassName?: string
}

/**
 * @deprecated Import `SetBadge` from `@/components/ui/badge` and rename `setCode`→`code`, `setName`→`name`.
 */
export function SetBadge({
  setCode,
  setName,
  className,
  iconClassName,
  showText = true,
  textClassName,
}: LegacySetBadgeProps) {
  return (
    <BadgeSetBadge
      code={setCode}
      name={setName}
      showText={showText}
      className={className}
      iconClassName={iconClassName}
      textClassName={textClassName}
    />
  )
}
