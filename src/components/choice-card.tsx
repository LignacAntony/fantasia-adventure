"use client"

import * as React from "react"
import { WandSparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { VariantProps } from "class-variance-authority"
import { badgeVariants } from "@/components/ui/badge"

export type ChoiceCardRiskVariant = VariantProps<typeof badgeVariants>["variant"]

export interface ChoiceCardProps extends Omit<React.ComponentProps<"div">, "title"> {
  icon?: React.ReactNode
  iconClassName?: string
  title: React.ReactNode
  riskLabel?: string
  riskVariant?: ChoiceCardRiskVariant
  description?: React.ReactNode
  avatars?: Array<{ initials: string; className?: string }>
  selected?: boolean
}

function ChoiceCard({
  icon,
  iconClassName = "text-theme-yellow",
  title,
  riskLabel,
  riskVariant = "green",
  description,
  avatars,
  selected = false,
  className,
  ...props
}: ChoiceCardProps) {
  const displayIcon = icon ?? <WandSparkles className="size-6" />

  return (
    <div
      role="article"
      className={cn(
        "flex items-start gap-4 rounded-xl border-2 bg-slate-800/90 p-4 transition-all duration-200",
        selected
          ? "border-violet-500 ring-2 ring-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          : "border-transparent",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-700 [&>svg]:size-6",
          iconClassName
        )}
        aria-hidden
      >
        {displayIcon}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold uppercase leading-tight text-white">
            {title}
          </span>
          {riskLabel != null && riskLabel !== "" && (
            <Badge variant={riskVariant}  className="uppercase">
              {riskLabel}
            </Badge>
          )}
        </div>
        {description != null && (
          <p className="text-sm leading-relaxed text-slate-300">
            {description}
          </p>
        )}
      </div>

      {avatars != null && avatars.length > 0 && (
        <div
          className="flex shrink-0 -space-x-2 *:ring-2 *:ring-slate-800"
          aria-hidden
        >
          {avatars.map((avatar, i) => (
            <div
              key={i}
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white",
                avatar.className ?? "bg-slate-600"
              )}
            >
              {avatar.initials}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { ChoiceCard }
