"use client"

import { cn } from "@/lib/utils"

interface SetBadgeProps {
  setCode: string
  setName?: string
  className?: string
  iconClassName?: string
  showText?: boolean
  textClassName?: string
}

export function SetBadge({
  setCode,
  setName,
  className,
  iconClassName,
  showText = true,
  textClassName
}: SetBadgeProps) {
  if (!setCode) return null
  let imgSrc = `https://svgs.scryfall.io/sets/${setCode.toLowerCase()}.svg`

  const useStar = setCode === 'SCH' || /PW\d*/g.test(setCode)

  if (setCode === 'PLST') {
    imgSrc = `https://svgs.scryfall.io/sets/planeswalker.svg`
  }

  if (useStar) {
    imgSrc = `https://svgs.scryfall.io/sets/star.svg`
  }

  return (
    <div 
      className={cn("flex items-center gap-1.5", className)}
      title={setName || `Set: ${setCode}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={`${setCode} set icon`}
        className={cn("h-3.5 w-3.5 shrink-0", iconClassName)}
      />
      {showText && (
        <span className={cn("text-xs text-muted-foreground uppercase font-mono tracking-wider", textClassName)}>
          {setCode}
        </span>
      )}
    </div>
  )
}
