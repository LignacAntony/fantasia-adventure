"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { BadgeClasse } from "@/components/badge-classe";
import type { BadgeClasseVariant } from "@/components/badge-classe";
import { Badge } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export type CharacterCardRoleTagVariant = VariantProps<
  typeof badgeVariants
>["variant"];

export interface CharacterCardProps extends Omit<
  React.ComponentProps<"article">,
  "title"
> {
  icon?: React.ReactNode;
  iconClassName?: string;
  classe?: BadgeClasseVariant;
  roleTag?: React.ReactNode;
  roleTagVariant?: CharacterCardRoleTagVariant;
  roleTagClassName?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  advantages?: string[];
  weaknesses?: string[];
}

function CharacterCard({
  icon,
  iconClassName,
  classe,
  roleTag,
  roleTagVariant = "yellow",
  roleTagClassName,
  title,
  description,
  advantages = [],
  weaknesses = [],
  className,
  ...props
}: CharacterCardProps) {
  const showIconArea = classe != null || icon != null;

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#1e293b] p-6 text-left shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {showIconArea &&
          (classe != null ? (
            <BadgeClasse variant={classe} />
          ) : (
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-sky-400/60 bg-slate-800/80 text-sky-400 [&>svg]:size-6",
                iconClassName,
              )}
            >
              {icon}
            </div>
          ))}
        {roleTag != null && roleTag !== "" && (
          <Badge
            variant={roleTagVariant}
            className={cn("uppercase tracking-wide", roleTagClassName)}
          >
            {roleTag}
          </Badge>
        )}
      </div>

      <h3 className="text-2xl font-bold uppercase leading-tight text-white">
        {title}
      </h3>

      {description && (
        <p className="text-sm leading-relaxed text-slate-400 line-clamp-3">
          {description}
        </p>
      )}

      <Separator className="bg-white/10" />

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Avantage
          </p>
          <ul className="space-y-1">
            {advantages.map((item, i) => (
              <li
                key={i}
                className="text-sm font-semibold uppercase text-emerald-500"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Faiblesse
          </p>
          <ul className="space-y-1">
            {weaknesses.map((item, i) => (
              <li
                key={i}
                className="text-sm font-semibold uppercase text-red-500"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export { CharacterCard };
