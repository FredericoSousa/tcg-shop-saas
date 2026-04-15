"use client"

import * as React from "react"
import { Checkbox as CheckboxRoot } from "@base-ui/react/checkbox"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

function Checkbox({ className, ...props }: CheckboxRoot.Root.Props) {

  return (
    <CheckboxRoot.Root
      className={cn(
        "peer group/checkbox flex size-5 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-background outline-none transition-all hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxRoot.Indicator className="flex items-center justify-center">
        <Check className="size-3.5 stroke-[3px]" />
      </CheckboxRoot.Indicator>
    </CheckboxRoot.Root>
  )
}

export { Checkbox }
