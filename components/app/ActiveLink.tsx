"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function ActiveLink({
  href,
  children,
  exact = false,
}: {
  href: string;
  children: ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || (href.length > 1 && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "transition-colors duration-150",
        isActive
          ? "font-medium text-forest-900"
          : "text-ink-500 hover:text-forest-900",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
