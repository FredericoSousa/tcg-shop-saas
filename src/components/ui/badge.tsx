"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { getLanguageData } from "@/lib/constants/languages"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 [a]:hover:bg-destructive/20",
        success:
          "bg-success-muted text-success [a]:hover:bg-success/20",
        warning:
          "bg-warning-muted text-warning [a]:hover:bg-warning/20",
        info:
          "bg-info-muted text-info [a]:hover:bg-info/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

interface SetBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  code: string
  name?: string
  showText?: boolean
  iconClassName?: string
  textClassName?: string
}

function SetBadge({
  code,
  name,
  showText = true,
  className,
  iconClassName,
  textClassName,
  ...props
}: SetBadgeProps) {
  if (!code) return null
  const lowerCode = code.toLowerCase()
  const useStar = code === "SCH" || /^PW\d*$/.test(code)
  const imgSrc = code === "PLST"
    ? "https://svgs.scryfall.io/sets/planeswalker.svg"
    : useStar
      ? "https://svgs.scryfall.io/sets/star.svg"
      : `https://svgs.scryfall.io/sets/${lowerCode}.svg`

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono uppercase tracking-wider text-xs text-muted-foreground",
        className
      )}
      title={name || `Set: ${code}`}
      role="img"
      aria-label={name ? `${name} (${code})` : `Set ${code}`}
      {...props}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt=""
        aria-hidden="true"
        className={cn("h-3.5 w-3.5 shrink-0", iconClassName)}
      />
      {showText && <span className={textClassName}>{code}</span>}
    </span>
  )
}

interface LanguageBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  code: string
  showCode?: boolean
}

function LanguageBadge({
  code,
  showCode = true,
  className,
  ...props
}: LanguageBadgeProps) {
  const lang = getLanguageData(code)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 text-2xs font-bold tabular-nums whitespace-nowrap shadow-sm",
        className
      )}
      title={lang.label}
      role="img"
      aria-label={`${lang.label} (${lang.code})`}
      {...props}
    >
      <span className="text-xs leading-none" aria-hidden="true">{lang.flag}</span>
      {showCode && <span>{lang.code}</span>}
    </span>
  )
}

export { Badge, SetBadge, LanguageBadge, badgeVariants }
