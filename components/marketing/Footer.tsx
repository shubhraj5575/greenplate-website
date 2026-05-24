import Link from "next/link";

const cols: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/login?redirect_to=/calculate", label: "For individuals" },
      { href: "/login?redirect_to=/org/calculate", label: "For restaurants" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/login", label: "Sign in" },
    ],
  },
  {
    title: "Methodology",
    links: [
      { href: "/methodology", label: "Methodology" },
      { href: "/methodology#scopes", label: "Scopes 1 / 2 / 3" },
      { href: "/methodology#sources", label: "Data sources" },
      { href: "/methodology#changelog", label: "Changelog" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Journal" },
      { href: "mailto:greenplate@greenplate.online", label: "Contact" },
      { href: "/about#careers", label: "Careers" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/methodology#faq", label: "FAQ" },
      { href: "/about#press", label: "Press kit" },
      { href: "/about#privacy", label: "Privacy" },
      { href: "/about#terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative isolate overflow-hidden bg-ink-700 text-cream-50">
      {/* Decorative top rule */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cream-50/25 to-transparent" />

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.2fr_2fr] lg:gap-16">
        {/* Brand */}
        <div className="max-w-sm">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-cream-50 text-ink-700">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3c4 4 6 7 6 11a6 6 0 0 1-12 0c0-4 2-7 6-11Z" />
                <path d="M12 8v11" />
              </svg>
            </span>
            <span className="font-display text-2xl tracking-tight">
              GreenPlate
            </span>
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream-100/75">
            Carbon footprint measurement for India&rsquo;s food sector. Numbers
            first, claims second.
          </p>
          <p className="mt-8 inline-flex items-center gap-2 rounded-pill border border-cream-50/15 px-3 py-1.5 text-[0.7rem] tracking-[0.18em] text-cream-100/80 uppercase">
            <span aria-hidden="true" className="text-amber-400">
              ●
            </span>
            Made in India
          </p>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {cols.map((c) => (
            <div key={c.title}>
              <h3 className="font-sans text-[0.7rem] font-semibold tracking-[0.2em] text-cream-100/70 uppercase">
                {c.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-cream-50/90 transition-colors hover:text-amber-400"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-cream-50/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-5 py-6 text-xs text-cream-100/70 sm:flex-row sm:items-center sm:px-8">
          <p>
            © {year} GreenPlate Labs. Measurement is a discipline, not a
            slogan.
          </p>
          <p className="tabular tracking-[0.18em] uppercase">
            v2 · measurement-only
          </p>
        </div>
      </div>
    </footer>
  );
}
