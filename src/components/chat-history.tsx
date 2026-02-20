"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface ChatHistoryProps extends React.ComponentProps<"div"> {
  senderName: React.ReactNode
  senderIcon?: React.ReactNode
  senderClassName?: string
  children: React.ReactNode
  watermarkIcon?: React.ReactNode
  watermarkClassName?: string
}

function ChatHistory({
  senderName,
  senderIcon,
  senderClassName = "text-amber-400",
  children,
  watermarkIcon,
  watermarkClassName,
  className,
  ...props
}: ChatHistoryProps) {
  return (
    <div
      role="article"
      className={cn(
        "relative overflow-hidden rounded-xl bg-slate-900 p-5",
        className
      )}
      {...props}
    >
      {watermarkIcon && (
        <div
          className={cn(
            "pointer-events-none absolute right-4 top-4 size-16 opacity-[0.08] [&>svg]:size-full",
            watermarkClassName
          )}
          aria-hidden
        >
          {watermarkIcon}
        </div>
      )}

      <div className="relative flex items-center gap-2">
        {senderIcon && (
          <span
            className={cn("flex shrink-0 [&>svg]:size-4", senderClassName)}
            aria-hidden
          >
            {senderIcon}
          </span>
        )}
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            senderClassName
          )}
        >
          {senderName}
        </span>
      </div>

      <blockquote className="relative mt-3 font-serif text-sm italic leading-relaxed text-slate-100">
        {children}
      </blockquote>
    </div>
  )
}

export { ChatHistory }
