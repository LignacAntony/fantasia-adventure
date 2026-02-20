"use client";

import * as React from "react";
import { Crown, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const defaultWatermarkIcon = <Crown className="text-slate-600" />;

export interface ChatHistoryProps extends React.ComponentProps<"div"> {
  senderName: React.ReactNode;
  senderIcon?: React.ReactNode;
  senderClassName?: string;
  children: React.ReactNode;
  watermarkIcon?: React.ReactNode | null;
  watermarkClassName?: string;
}

function ChatHistory({
  senderName,
  senderIcon,
  senderClassName = "text-theme-yellow",
  children,
  watermarkIcon = defaultWatermarkIcon,
  watermarkClassName,
  className,
  ...props
}: ChatHistoryProps) {
  const displayIcon = senderIcon ?? <Sparkles className="size-4" />;
  const displayWatermark =
    watermarkIcon === undefined ? defaultWatermarkIcon : watermarkIcon;

  return (
    <div
      role="article"
      className={cn(
        "relative overflow-hidden rounded-xl bg-slate-900 p-5",
        className,
      )}
      {...props}
    >
      {displayWatermark != null && (
        <div
          className={cn(
            "pointer-events-none absolute right-4 top-4 size-16 opacity-[0.08] [&>svg]:size-full",
            watermarkClassName,
          )}
          aria-hidden
        >
          {displayWatermark}
        </div>
      )}

      <div className="relative flex items-center gap-2">
        <span
          className={cn("flex shrink-0 [&>svg]:size-4", senderClassName)}
          aria-hidden
        >
          {displayIcon}
        </span>
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            senderClassName,
          )}
        >
          {senderName}
        </span>
      </div>

      <blockquote className="relative mt-3 font-serif text-sm italic leading-relaxed text-slate-100">
        {children}
      </blockquote>
    </div>
  );
}

export { ChatHistory };
