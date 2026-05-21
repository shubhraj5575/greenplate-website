"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Journal" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <header
      className={[
        "sticky top-0 z-50 w-full transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-b border-ink-900/8 bg-cream-50/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-[72px] sm:px-8"
      >
        <Link
          href="/"
          aria-label="GreenPlate, home"
          className="group flex items-center gap-2"
        >
          <Mark />
          <span className="font-display text-[1.35rem] leading-none tracking-tight text-forest-900 sm:text-[1.4rem]">
            GreenPlate
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="relative inline-flex items-center px-3 py-2 text-sm text-ink-700 transition-colors hover:text-forest-900"
              >
                {l.label}
                <span className="pointer-events-none absolute right-3 bottom-1.5 left-3 h-px origin-left scale-x-0 bg-forest-900 transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-pill border border-forest-900/15 px-4 py-2 text-sm font-medium text-forest-900 transition-colors hover:border-forest-900/40 hover:bg-forest-900/5"
          >
            Sign in
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-forest-900/10 text-forest-900 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile sheet */}
      <div
        id="mobile-menu"
        className={[
          "lg:hidden",
          "overflow-hidden border-t border-ink-900/8 bg-cream-50",
          "transition-[max-height,opacity] duration-300 ease-out",
          open ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
        aria-hidden={!open}
      >
        <ul className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4 sm:px-8">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 font-display text-2xl text-forest-900"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="mt-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block rounded-pill bg-forest-900 px-5 py-3 text-center text-sm font-medium text-cream-50"
            >
              Sign in
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}

function Mark() {
  // Compact diamond-leaf glyph — sits beside the wordmark
  return (
    <span
      aria-hidden="true"
      className="relative grid h-8 w-8 place-items-center rounded-[10px] bg-forest-900 text-cream-50"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3c4 4 6 7 6 11a6 6 0 0 1-12 0c0-4 2-7 6-11Z" />
        <path d="M12 8v11" />
      </svg>
    </span>
  );
}
