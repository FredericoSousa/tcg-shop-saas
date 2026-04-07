"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "@/lib/utils"

function Tabs({ ...props }: TabsPrimitive.Root.Props) {
  return (
    <>
      <style>{`
        [data-slot="tabs-trigger"][aria-selected="true"],
        [data-slot="tabs-trigger"][data-selected="true"],
        [data-slot="tabs-trigger"][data-state="active"] {
          background-color: var(--primary) !important;
          color: var(--primary-foreground) !important;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
          font-weight: 800 !important;
          border-radius: 8px !important;
          transform: translateY(-1px);
        }
        [data-slot="tabs-trigger"] {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
      `}</style>
      <TabsPrimitive.Root data-slot="tabs" {...props} />
    </>
  )
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex w-full items-center justify-start border-b border-border bg-transparent p-0 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, value, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      value={value}
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-4 py-2 text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-muted-foreground hover:text-foreground outline-none cursor-pointer",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        "mt-6 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
