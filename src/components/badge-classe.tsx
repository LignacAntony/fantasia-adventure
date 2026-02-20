"use client"

import * as React from "react"
import {
  BowArrow,
  Slice,
  Shield,
  Skull,
  Sword,
  WandSparkles,
} from "lucide-react"

import { cn } from "@/lib/utils"

const variantConfig = {
  sword: {
    Icon: Sword,
    className:
      "border-theme-blue/60 bg-slate-800/80 text-theme-blue [&>svg]:size-6",
  },
  bow: {
    Icon: BowArrow,
    className:
      "border-theme-green/60 bg-slate-800/80 text-theme-green [&>svg]:size-6",
  },
  skull: {
    Icon: Skull,
    className:
      "border-theme-red/60 bg-slate-800/80 text-theme-red [&>svg]:size-6",
  },
  shield: {
    Icon: Shield,
    className:
      "border-theme-yellow/60 bg-slate-800/80 text-theme-yellow [&>svg]:size-6",
  },
  wand: {
    Icon: WandSparkles,
    className:
      "border-theme-purple/60 bg-slate-800/80 text-theme-purple [&>svg]:size-6",
  },
  slice: {
    Icon: Slice,
    className:
      "border-theme-orange/60 bg-slate-800/80 text-theme-orange [&>svg]:size-6",
  },
} as const

export type BadgeClasseVariant = keyof typeof variantConfig

export interface BadgeClasseProps extends React.ComponentProps<"div"> {
  variant: BadgeClasseVariant
}

function BadgeClasse({
  variant,
  className,
  ...props
}: BadgeClasseProps) {
  const { Icon, className: variantClassName } = variantConfig[variant]

  return (
    <div
      role="img"
      aria-label={variant}
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-xl border-2",
        variantClassName,
        className
      )}
      {...props}
    >
      <Icon className="size-6" />
    </div>
  )
}

export { BadgeClasse }
