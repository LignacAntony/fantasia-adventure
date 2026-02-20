import * as React from "react";

import { cn } from "@/lib/utils";

export interface FeatureCardProps extends Omit<
  React.ComponentProps<"div">,
  "title"
> {
  icon?: React.ReactNode;
  iconClassName?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "dark";
}

function FeatureCard({
  icon,
  iconClassName,
  title,
  description,
  variant = "default",
  className,
  ...props
}: FeatureCardProps) {
  const defaultIconColor =
    variant === "default" ? "text-primary" : "text-[#a78bfa]";

  return (
    <div
      role="article"
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-6 text-left",
        variant === "default" &&
          "bg-card text-card-foreground border-border shadow-sm",
        variant === "dark" &&
          "border-white/10 bg-[#1a1a2e] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.05)]",
        className,
      )}
      {...props}
    >
      {icon && (
        <div
          className={cn(
            "flex size-10 items-center justify-center [&>svg]:size-6",
            iconClassName ?? defaultIconColor,
          )}
        >
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3
          className={cn(
            "font-semibold leading-tight",
            variant === "default" && "text-card-foreground",
            variant === "dark" && "text-white",
          )}
        >
          {title}
        </h3>
        {description && (
          <p
            className={cn(
              "text-sm leading-relaxed",
              variant === "default" && "text-muted-foreground",
              variant === "dark" && "text-white/80",
            )}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export { FeatureCard };
