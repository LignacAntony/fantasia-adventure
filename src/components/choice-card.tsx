"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type ChoiceCardRiskVariant = "low" | "medium" | "high"

const riskBadgeClasses: Record<ChoiceCardRiskVariant, string> = {
  low: "bg-emerald-700/90 text-white border-emerald-600",
  medium: "bg-amber-700/90 text-white border-amber-600",
  high: "bg-red-700/90 text-white border-red-600",
}

export interface ChoiceCardProps extends React.ComponentProps<"div"> {
  icon?: React.ReactNode
  title: React.ReactNode
  riskLabel?: string
  riskVariant?: ChoiceCardRiskVariant
  description?: React.ReactNode
  avatars?: Array<{ initials: string; className?: string }>
  selected?: boolean
}

function ChoiceCard({
  icon,
  title,
  riskLabel,
  riskVariant = "medium",
  description,
  avatars,
  selected = false,
  className,
  ...props
}: ChoiceCardProps) {
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
      {icon != null && (
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-white [&>svg]:size-6"
          aria-hidden
        >
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold uppercase leading-tight text-white">
            {title}
          </span>
          {riskLabel != null && riskLabel !== "" && (
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs font-medium uppercase",
                riskBadgeClasses[riskVariant]
              )}
            >
              {riskLabel}
            </span>
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
