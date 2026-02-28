"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navLinkClass = cn(
  navigationMenuTriggerStyle(),
  "bg-transparent text-white/95 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white focus-visible:ring-white/20",
);

export type NavItem = {
  label: string;
  href: string;
};

export type NavbarProps = {
  brand?: React.ReactNode;
  items?: NavItem[];
  className?: string;
};

function NavLinks({
  items,
  className,
}: {
  items: NavItem[];
  className?: string;
}) {
  return (
    <NavigationMenu viewport={false} className={cn("max-w-none", className)}>
      <NavigationMenuList className="gap-1">
        {items.map((item) => (
          <NavigationMenuItem key={`${item.label}-${item.href}`}>
            <NavigationMenuLink asChild>
              <Link href={item.href} className={navLinkClass}>
                {item.label}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export function Navbar({ brand, items = [], className }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-white/10 bg-[#080e20]/90 backdrop-blur-md text-white/95",
        className,
      )}
    >
      <div className="container flex h-14 items-center justify-between gap-4 px-4">
        {brand != null && (
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-white no-underline hover:text-white/90"
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

        {items.length > 0 && (
          <>
            <nav className="hidden flex-1 items-center justify-end gap-2 md:flex">
              <NavLinks items={items} className="flex-1 justify-end" />
            </nav>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger
                aria-label="Ouvrir le menu"
                className="flex size-10 items-center justify-center rounded-md text-white/95 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080e20] md:hidden"
              >
                <Menu className="size-6" />
              </SheetTrigger>
              <SheetContent
                side="right"
                className="border-white/10 bg-[#080e20] text-white/95"
              >
                <SheetHeader>
                  <SheetTitle className="text-white">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 pt-4">
                  {items.map((item) => (
                    <Link
                      key={`${item.label}-${item.href}`}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        navLinkClass,
                        "block w-full justify-start rounded-md px-3 py-2 text-base",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </>
        )}
      </div>
    </header>
  );
}
