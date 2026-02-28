"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type FooterLink = {
  label: string;
  href: string;
};

export type FooterProps = {
  brand?: React.ReactNode;
  links?: FooterLink[];
  copyright?: string;
  className?: string;
};

export function Footer({
  brand,
  links = [],
  copyright,
  className,
}: FooterProps) {
  return (
    <footer
      className={cn(
        "relative z-10 w-full border-t border-white/10 bg-[#080e20] text-white/80",
        className,
      )}
    >
      <div className="container flex flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {brand != null && (
          <Link
            href="/"
            className="font-semibold text-white no-underline hover:text-white/90"
          >
            {typeof brand === "string" ? (
              <span className="bg-linear-to-r from-purple-500 via-pink-500 to-amber-400 bg-clip-text text-transparent">
                {brand}
              </span>
            ) : (
              brand
            )}
          </Link>
        )}

        {links.length > 0 && (
          <nav
            className="flex flex-wrap items-center gap-x-6 gap-y-1"
            aria-label="Pied de page"
          >
            {links.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                className="text-sm text-white/80 underline-offset-4 hover:text-white hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {copyright != null && (
          <p className="text-sm text-white/60">{copyright}</p>
        )}
      </div>
    </footer>
  );
}
