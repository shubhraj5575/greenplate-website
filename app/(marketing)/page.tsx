import Link from "next/link";
import {
  ArrowRight,
  Database,
  Leaf,
  Utensils,
  Sprout,
  Scale,
  Gauge,
  BookOpen,
} from "lucide-react";
import { HeroVisual } from "@/components/marketing/HeroVisual";
import { FAQ } from "@/components/marketing/FAQ";
import { RevealOnView } from "@/components/marketing/RevealOnView";
import { CountUp } from "@/components/marketing/CountUp";
import { ThaliPreview } from "@/components/marketing/ThaliPreview";
import { JournalCards } from "@/components/marketing/JournalCards";

const sources = [
  "Our World in Data",
  "DEFRA",
  "FAO",
  "Agribalyse",
  "ICAT India",
  "CEA",
  "IPCC AR6",
];

const pillars = [
  {
    kicker: "For you",
    icon: Leaf,
    title: "Your plate, your number.",
    body: "Log what you eat. See the footprint of a thali, a burger, a thirty-day stretch. No streaks, no shame — just a number you can read.",
    bullets: [
      "1,500+ Indian-priority foods",
      "Daily and weekly trends",
      "Compare swaps, not lifestyles",
    ],
  },
  {
    kicker: "For your kitchen",
    icon: Utensils,
    title: "Menu-aware, Scope-aware.",
    body: "Restaurants, cafes, cloud kitchens — measure the menu, the energy, the supply chain. A ledger built around how a kitchen actually runs.",
    bullets: [
      "Scope 1 / 2 / 3 separation",
      "Recipe-level emissions",
      "Vendor and grid factors",
    ],
  },
  {
    kicker: "Built on real data",
    icon: Database,
    title: "Every number cites a source.",
    body: "We don't average a vibe. Each factor in the database carries provenance — the study, the geography, the year, the uncertainty band.",
    bullets: [
      "30+ Indian emission factors",
      "Open methodology",
      "Confidence bands on every value",
    ],
  },
];

const kpis = [
  { value: "1,500+", label: "Indian-priority food items in the database" },
  { value: "30+", label: "Indian emission factors cited by source" },
  { value: "1·2·3", label: "Scopes separated for restaurant accounting" },
  { value: "Open", label: "Methodology, published and versioned" },
];

const steps = [
  {
    n: "01",
    title: "Tell us what you serve",
    body: "Log meals, upload a menu, or import recipes. Quantities in grams, portions, or thalis — whichever fits.",
    icon: Sprout,
  },
  {
    n: "02",
    title: "We calculate, transparently",
    body: "Every ingredient is matched to a sourced emission factor. You see the math, the source, and the confidence band.",
    icon: Scale,
  },
  {
    n: "03",
    title: "You track, and reduce",
    body: "Trends over weeks, comparisons across menus, swaps that actually move the number. No offsets to buy.",
    icon: Gauge,
  },
];

export default function HomePage() {
  return (
    <>
      {/* ───────── Hero ───────── */}
      <section
        aria-labelledby="hero-title"
        className="relative isolate overflow-hidden"
      >
        {/* Background atmosphere */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute inset-x-0 top-0 h-[120%] bg-[radial-gradient(ellipse_at_top,rgba(132,169,140,0.18),transparent_55%)]" />
          <Grid />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pt-10 pb-20 sm:px-8 sm:pt-16 sm:pb-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-20">
          {/* Text */}
          <div className="relative">
            <SectionLabel index="00" title="Carbon for the kitchen" />
            <h1
              id="hero-title"
              className="mt-6 font-display text-[clamp(2.5rem,6.4vw,5.25rem)] leading-[1.02] tracking-[-0.02em] text-forest-900"
            >
              Measure what you serve.
              <br />
              <span className="italic text-ink-700">Reduce what matters.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-500 sm:text-xl">
              Carbon footprint measurement for India&rsquo;s food sector — for
              the home cook tracking a thali, and the cloud kitchen counting
              every gram. Built on real LCA data. No offsets, no spin.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login?redirect_to=/calculate"
                className="group inline-flex items-center justify-center gap-2 rounded-pill bg-forest-900 px-6 py-3.5 text-sm font-medium text-cream-50 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink-900 hover:shadow-[var(--shadow-card)]"
              >
                Calculate your footprint
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login?redirect_to=/org/calculate"
                className="inline-flex items-center justify-center gap-2 rounded-pill border border-forest-900/15 bg-cream-50 px-6 py-3.5 text-sm font-medium text-forest-900 transition-colors hover:border-forest-900/40 hover:bg-cream-100"
              >
                For restaurants
              </Link>
            </div>

            {/* Beneath-CTA proof line */}
            <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs tracking-wide text-ink-400 uppercase">
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full bg-leaf-500"
                />
                Free for individuals
              </span>
              <span className="hidden text-ink-300 sm:inline">·</span>
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"
                />
                Pilot pricing for kitchens
              </span>
            </p>
          </div>

          {/* Visual */}
          <div className="relative flex justify-center lg:justify-end">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ───────── Trust strip ───────── */}
      <section
        aria-label="Data sources"
        className="border-y border-ink-900/10 bg-cream-100/50"
      >
        <RevealOnView>
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-12">
            <p className="shrink-0 font-sans text-[0.7rem] font-semibold tracking-[0.22em] text-ink-500 uppercase">
              Built on data from
            </p>
            <ul className="flex flex-wrap items-center gap-x-7 gap-y-3 sm:gap-x-10">
              {sources.map((s) => (
                <li
                  key={s}
                  className="font-display text-sm tracking-[0.14em] text-forest-900/85 uppercase"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
        </RevealOnView>
      </section>

      {/* ───────── Pillars ───────── */}
      <section
        aria-labelledby="pillars-title"
        className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32"
      >
        <RevealOnView>
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <SectionLabel index="01" title="What we built" />
            <h2
              id="pillars-title"
              className="mt-5 font-display text-4xl leading-[1.08] tracking-tight text-ink-900 sm:text-5xl"
            >
              Two surfaces.{" "}
              <span className="italic text-forest-700">
                One serious engine.
              </span>
            </h2>
          </div>
          <p className="max-w-md text-base text-ink-500 sm:text-lg">
            We don&rsquo;t bolt a sustainability label onto a guess. The same
            ingredient-level math sits under the consumer app and the
            restaurant ledger.
          </p>
        </div>
        </RevealOnView>

        <ul className="mt-14 grid gap-5 md:grid-cols-3">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <RevealOnView key={p.title} delay={Math.min(i * 0.08, 0.16)}>
              <li
                className="group relative flex flex-col rounded-card border border-ink-900/8 bg-cream-50 p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-forest-900/20 hover:shadow-[var(--shadow-card)] sm:p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-forest-900 text-cream-50">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <span className="tabular font-sans text-[0.7rem] tracking-[0.18em] text-ink-300 uppercase">
                    § {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-7 text-[0.7rem] font-semibold tracking-[0.2em] text-forest-700 uppercase">
                  {p.kicker}
                </p>
                <h3 className="mt-2 font-display text-2xl leading-snug text-ink-900">
                  {p.title}
                </h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-500">
                  {p.body}
                </p>
                <ul className="mt-6 space-y-2 border-t border-ink-900/8 pt-5">
                  {p.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-3 text-sm text-ink-700"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 inline-block h-1 w-3 shrink-0 bg-forest-700"
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              </li>
              </RevealOnView>
            );
          })}
        </ul>
      </section>

      {/* ───────── Numbers band ───────── */}
      <section
        aria-labelledby="kpi-title"
        className="border-y border-ink-900/10 bg-cream-100/60"
      >
        <RevealOnView>
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-xl">
              <SectionLabel index="02" title="By the numbers" />
              <h2
                id="kpi-title"
                className="mt-5 font-display text-3xl leading-tight text-ink-900 sm:text-4xl"
              >
                What you can{" "}
                <span className="italic text-forest-700">actually</span> see in
                the app today.
              </h2>
            </div>
            <Link
              href="/methodology"
              className="group inline-flex items-center gap-2 text-sm font-medium text-forest-900"
            >
              <span className="border-b border-forest-900/30 pb-0.5 transition-colors group-hover:border-forest-900">
                Read the methodology
              </span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <ul className="mt-12 grid gap-px overflow-hidden rounded-card bg-ink-900/10 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k, i) => (
              <li
                key={k.label}
                className="flex flex-col justify-between bg-cream-50 p-7 sm:p-8"
              >
                <span className="tabular font-sans text-[0.62rem] tracking-[0.22em] text-ink-300 uppercase">
                  {String(i + 1).padStart(2, "0")} / 04
                </span>
                <p className="tabular mt-10 font-display text-5xl leading-none tracking-tight text-forest-900 sm:text-[3.5rem]">
                  {i === 0 ? (
                    <CountUp to={1500} suffix="+" />
                  ) : i === 1 ? (
                    <CountUp to={30} suffix="+" />
                  ) : (
                    k.value
                  )}
                </p>
                <p className="mt-5 max-w-[26ch] text-sm leading-relaxed text-ink-500">
                  {k.label}
                </p>
              </li>
            ))}
          </ul>
        </div>
        </RevealOnView>
      </section>

      {/* ───────── Thali preview ───────── */}
      <ThaliPreview />

      {/* ───────── How it works teaser ───────── */}
      <section
        aria-labelledby="how-title"
        className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32"
      >
        <RevealOnView>
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-xl">
            <SectionLabel index="03" title="How it works" />
            <h2
              id="how-title"
              className="mt-5 font-display text-4xl leading-[1.1] tracking-tight text-ink-900 sm:text-5xl"
            >
              Three steps.{" "}
              <span className="italic text-forest-700">No mystery box.</span>
            </h2>
          </div>
          <Link
            href="/how-it-works"
            className="group inline-flex items-center gap-2 text-sm font-medium text-forest-900"
          >
            <span className="border-b border-forest-900/30 pb-0.5 transition-colors group-hover:border-forest-900">
              See the full walkthrough
            </span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
        </RevealOnView>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-card border border-ink-900/10 bg-ink-900/10 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <RevealOnView key={s.n} delay={Math.min(i * 0.08, 0.16)}>
              <li
                className="relative flex flex-col gap-4 bg-cream-50 p-7 sm:p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="tabular font-display text-3xl text-ink-300">
                    {s.n}
                  </span>
                  <Icon
                    className="h-5 w-5 text-forest-700"
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="font-display text-2xl leading-snug text-ink-900">
                  {s.title}
                </h3>
                <p className="text-[0.95rem] leading-relaxed text-ink-500">
                  {s.body}
                </p>
              </li>
              </RevealOnView>
            );
          })}
        </ol>
      </section>

      {/* ───────── Methodology teaser ───────── */}
      <section
        aria-labelledby="methodology-title"
        className="relative isolate overflow-hidden border-y border-ink-900/10 bg-cream-100/70"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.4]"
        >
          <Grid />
        </div>
        <RevealOnView>
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <SectionLabel index="04" title="The methodology" />
            <h2
              id="methodology-title"
              className="mt-5 font-display text-3xl leading-tight text-ink-900 sm:text-4xl"
            >
              We&rsquo;d rather be{" "}
              <span className="italic text-forest-700">accurate</span> than
              comforting.
            </h2>
            <p className="mt-5 max-w-md text-base text-ink-500 sm:text-lg">
              The full methodology — every factor, every assumption, every
              caveat — lives in public. If you find a better source, tell us;
              we&rsquo;ll update the database.
            </p>
            <Link
              href="/methodology"
              className="group mt-8 inline-flex items-center gap-2 rounded-pill border border-forest-900/20 bg-cream-50 px-5 py-2.5 text-sm font-medium text-forest-900 transition-colors hover:border-forest-900/40"
            >
              <BookOpen
                className="h-4 w-4"
                aria-hidden="true"
                strokeWidth={1.6}
              />
              Read the methodology
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <figure className="relative">
            <span
              aria-hidden="true"
              className="absolute -top-6 -left-2 font-display text-[7rem] leading-none text-forest-900/15 sm:-top-8 sm:-left-4 sm:text-[9rem]"
            >
              &ldquo;
            </span>
            <blockquote className="relative pl-6 sm:pl-12">
              <p className="font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-[1.2] text-ink-900">
                Every number cites a source.{" "}
                <span className="italic text-forest-700">
                  Every assumption is named.
                </span>{" "}
                Every estimate carries its error bars on its sleeve.
              </p>
              <figcaption className="mt-8 flex items-center gap-4 text-sm text-ink-500">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-forest-900 font-display text-cream-50">
                  G
                </span>
                <span>
                  <span className="block font-medium text-ink-900">
                    GreenPlate research team
                  </span>
                  <span className="block text-xs tracking-wide text-ink-400 uppercase">
                    Methodology v2 · published in full
                  </span>
                </span>
              </figcaption>
            </blockquote>
          </figure>
        </div>
        </RevealOnView>
      </section>

      {/* ───────── Journal ───────── */}
      <JournalCards />

      {/* ───────── FAQ ───────── */}
      <section
        aria-labelledby="faq-title"
        className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32"
      >
        <RevealOnView>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.6fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionLabel index="05" title="Common questions" />
            <h2
              id="faq-title"
              className="mt-5 font-display text-4xl leading-[1.08] tracking-tight text-ink-900 sm:text-5xl"
            >
              Honest answers,{" "}
              <span className="italic text-forest-700">in plain English.</span>
            </h2>
            <p className="mt-6 max-w-sm text-base text-ink-500">
              Still curious? Write to us at{" "}
              <a
                href="mailto:greenplate@greenplate.online"
                className="text-forest-900 underline decoration-forest-900/30 underline-offset-4 transition-colors hover:decoration-forest-900"
              >
                greenplate@greenplate.online
              </a>
              .
            </p>
          </div>
          <div>
            <FAQ />
          </div>
        </div>
        </RevealOnView>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section
        aria-labelledby="cta-title"
        className="relative isolate overflow-hidden bg-forest-900 text-cream-50"
      >
        {/* Decorative grid + halo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cream-50/25 to-transparent" />
          <div className="absolute -top-32 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(132,169,140,0.22),transparent_60%)]" />
          <GridDark />
        </div>

        <RevealOnView>
        <div className="mx-auto max-w-5xl px-5 py-24 text-center sm:px-8 sm:py-32">
          <p className="font-sans text-[0.7rem] tracking-[0.24em] text-cream-100/70 uppercase">
            Open beta · India
          </p>
          <h2
            id="cta-title"
            className="mt-6 font-display text-[clamp(2.2rem,5.5vw,4.5rem)] leading-[1.04] tracking-tight"
          >
            Stop estimating.
            <br />
            <span className="italic text-leaf-500">Start measuring.</span>
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-base text-cream-100/85 sm:text-lg">
            Pick the surface that fits. Both run on the same engine, the same
            sources, the same honest math.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login?redirect_to=/calculate"
              className="group inline-flex items-center justify-center gap-2 rounded-pill bg-cream-50 px-6 py-3.5 text-sm font-medium text-forest-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-bone-100"
            >
              Calculate your footprint
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login?redirect_to=/org/calculate"
              className="inline-flex items-center justify-center gap-2 rounded-pill border border-cream-50/25 px-6 py-3.5 text-sm font-medium text-cream-50 transition-colors hover:border-cream-50/60 hover:bg-cream-50/5"
            >
              For restaurants
            </Link>
          </div>
        </div>
        </RevealOnView>
      </section>
    </>
  );
}

/* ──────────────── helpers ──────────────── */

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3 text-[0.68rem] tracking-[0.22em] uppercase">
      <span className="tabular text-ink-300">§ {index}</span>
      <span
        aria-hidden="true"
        className="h-px w-8 bg-forest-700/40"
      />
      <span className="font-medium text-forest-700">{title}</span>
    </div>
  );
}

function Grid() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="gp-grid"
          width="56"
          height="56"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 56 0 L 0 0 0 56"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.06"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="url(#gp-grid)"
        className="text-forest-900"
      />
    </svg>
  );
}

function GridDark() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="gp-grid-dark"
          width="56"
          height="56"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 56 0 L 0 0 0 56"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="url(#gp-grid-dark)"
        className="text-cream-50"
      />
    </svg>
  );
}
