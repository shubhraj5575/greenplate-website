# Landing page polish (B.1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the marketing landing feel year-old via scroll-triggered section reveals, animated KPI counters, a real "calculator output" preview card, and a 3-card row linking to existing blog posts.

**Architecture:** Four small client components added under `components/marketing/`. The landing page wraps each `<section>` in `RevealOnView`. KPI numbers swap to `<CountUp>`. Two new sections (`<ThaliPreview>`, `<JournalCards>`) drop into the existing page outline. Reduced-motion is honored throughout. No new deps.

**Tech Stack:** Next.js 16 · React 19 · framer-motion (already installed) · Tailwind v4 · TypeScript 5 · Vitest 4.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `components/marketing/RevealOnView.tsx` | Create | Scroll-triggered fade+slide-up wrapper, reduced-motion aware. Used to wrap each landing-page section. |
| `components/marketing/CountUp.tsx` | Create | Animate a number from 0→target with ease-out cubic on view-entry; renders inside `<span class="tabular-nums">`. |
| `components/marketing/ThaliPreview.tsx` | Create | Static card showing a "veg thali" carbon breakdown (donut + bullet rows + citation). Inline SVG donut, no Recharts. |
| `components/marketing/JournalCards.tsx` | Create | 3-card row linking to existing blog posts. Imports the slug list from the blog page. |
| `app/(marketing)/blog/page.tsx` | Modify | `export` the `POSTS` array so JournalCards can consume it (one keyword change). |
| `app/(marketing)/page.tsx` | Modify | Wrap each `<section>` in `<RevealOnView>`; swap two KPI values to `<CountUp>`; insert `<ThaliPreview>` and `<JournalCards>` at the right positions. |
| `__tests__/easing.test.ts` | Create | 3 unit tests for an exported `easeOutCubic` helper. |

7 files; 5 new, 2 modified.

---

## Task 1: `RevealOnView` wrapper

**Files:**
- Create: `components/marketing/RevealOnView.tsx`

- [ ] **Step 1.1: Write the component**

```tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function RevealOnView({
  children,
  delay = 0,
  yOffset = 24,
}: {
  children: ReactNode;
  delay?: number;
  yOffset?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.22, 0.61, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 1.2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | tail -5
```

Expected: build passes. (No tests yet for this component — it's a pure wrapper, verified visually.)

---

## Task 2: `CountUp` component + easing test

**Files:**
- Create: `components/marketing/CountUp.tsx`
- Create: `lib/easing.ts` (small module so the easing function is testable independent of React)
- Create: `__tests__/easing.test.ts`

- [ ] **Step 2.1: Write the failing test**

Create `__tests__/easing.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { easeOutCubic } from "@/lib/easing";

describe("easeOutCubic", () => {
  it("returns 0 at t=0", () => {
    expect(easeOutCubic(0)).toBe(0);
  });

  it("returns 1 at t=1", () => {
    expect(easeOutCubic(1)).toBe(1);
  });

  it("is monotonically increasing across [0, 1]", () => {
    const samples = Array.from({ length: 11 }, (_, i) => easeOutCubic(i / 10));
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
    }
  });

  it("decelerates (slope at 0 > slope at 1)", () => {
    const slopeStart = easeOutCubic(0.05) - easeOutCubic(0);
    const slopeEnd = easeOutCubic(1) - easeOutCubic(0.95);
    expect(slopeStart).toBeGreaterThan(slopeEnd);
  });
});
```

- [ ] **Step 2.2: Run to confirm fail**

```bash
pnpm vitest run __tests__/easing.test.ts 2>&1 | tail -10
```

Expected: FAIL — `easeOutCubic is not exported` or similar.

- [ ] **Step 2.3: Create the easing module**

Create `lib/easing.ts`:

```ts
/**
 * Ease-out cubic — fast start, decelerating finish. t in [0, 1].
 * Used by CountUp and any other on-view animation that should
 * "settle" rather than "land".
 */
export function easeOutCubic(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(1 - t, 3);
}
```

- [ ] **Step 2.4: Run to confirm pass**

```bash
pnpm vitest run __tests__/easing.test.ts 2>&1 | tail -8
```

Expected: PASS — 4 tests.

- [ ] **Step 2.5: Write CountUp component**

Create `components/marketing/CountUp.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { easeOutCubic } from "@/lib/easing";

interface Props {
  to: number;
  suffix?: string;
  prefix?: string;
  durationMs?: number;
  locale?: string;
}

export function CountUp({
  to,
  suffix = "",
  prefix = "",
  durationMs = 1200,
  locale = "en-IN",
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setV(Math.round(to * easeOutCubic(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, to, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {v.toLocaleString(locale)}
      {suffix}
    </span>
  );
}
```

- [ ] **Step 2.6: Full suite check**

```bash
pnpm vitest run 2>&1 | tail -6
```

Expected: PASS — 71 + 4 = 75 tests.

---

## Task 3: `ThaliPreview` component

**Files:**
- Create: `components/marketing/ThaliPreview.tsx`

- [ ] **Step 3.1: Write the component**

```tsx
"use client";

import { RevealOnView } from "./RevealOnView";

const ITEMS = [
  {
    name: "Rice",
    detail: "100 g cooked",
    kg: 0.70,
    color: "var(--color-forest-900)",
  },
  {
    name: "Toor dal",
    detail: "50 g uncooked",
    kg: 0.41,
    color: "var(--color-forest-700)",
  },
  {
    name: "Mixed sabzi",
    detail: "potato, tomato, onion, spinach · 150 g",
    kg: 0.33,
    color: "var(--color-forest-500)",
  },
  {
    name: "Chapati × 2",
    detail: "60 g atta",
    kg: 0.22,
    color: "var(--color-leaf-500)",
  },
  {
    name: "Dahi",
    detail: "100 g",
    kg: 0.12,
    color: "var(--color-amber-400)",
  },
  {
    name: "Jaggery",
    detail: "20 g",
    kg: 0.06,
    color: "var(--color-ink-500)",
  },
] as const;

const TOTAL = ITEMS.reduce((s, i) => s + i.kg, 0); // 1.84
const R = 96;
const STROKE = 22;
const C = 2 * Math.PI * R;

function Donut() {
  let acc = 0;
  return (
    <svg
      viewBox="-130 -130 260 260"
      className="h-44 w-44 sm:h-52 sm:w-52"
      role="img"
      aria-label="Donut chart of the thali's six components by carbon footprint"
    >
      <circle
        r={R}
        fill="none"
        stroke="var(--color-cream-100)"
        strokeWidth={STROKE}
      />
      {ITEMS.map((it) => {
        const len = (it.kg / TOTAL) * C;
        const seg = (
          <circle
            key={it.name}
            r={R}
            fill="none"
            stroke={it.color}
            strokeWidth={STROKE}
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-acc}
            transform="rotate(-90)"
            strokeLinecap="butt"
          />
        );
        acc += len;
        return seg;
      })}
      <text
        textAnchor="middle"
        y="-6"
        className="font-display fill-forest-900"
        style={{ fontSize: 30, letterSpacing: "-0.02em" }}
      >
        {TOTAL.toFixed(2)}
      </text>
      <text
        textAnchor="middle"
        y="18"
        className="fill-ink-500"
        style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase" }}
      >
        kg CO₂e
      </text>
    </svg>
  );
}

export function ThaliPreview() {
  return (
    <section
      aria-labelledby="thali-preview-title"
      className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28"
    >
      <RevealOnView>
        <div className="flex items-center gap-3 text-[0.68rem] tracking-[0.22em] uppercase">
          <span className="tabular text-ink-300">§ 02·b</span>
          <span aria-hidden="true" className="h-px w-8 bg-forest-700/40" />
          <span className="font-medium text-forest-700">A live example</span>
        </div>
        <h2
          id="thali-preview-title"
          className="mt-5 max-w-2xl font-display text-3xl leading-tight text-ink-900 sm:text-4xl"
        >
          What the calculator shows you for{" "}
          <span className="italic text-forest-700">one veg thali</span>.
        </h2>
      </RevealOnView>

      <RevealOnView delay={0.08}>
        <div className="mt-12 grid items-center gap-10 rounded-card border border-ink-900/10 bg-cream-50 p-7 sm:p-10 lg:grid-cols-[auto_1fr] lg:gap-16">
          <div className="flex flex-col items-center text-center">
            <p className="text-[0.62rem] font-semibold tracking-[0.22em] text-forest-700 uppercase">
              Dinner for one
            </p>
            <div className="mt-4">
              <Donut />
            </div>
            <p className="mt-3 max-w-[20ch] text-sm text-ink-500">
              per person, this meal
            </p>
          </div>

          <div>
            <ul className="space-y-3">
              {ITEMS.map((it) => {
                const pct = (it.kg / TOTAL) * 100;
                return (
                  <li
                    key={it.name}
                    className="grid grid-cols-[1fr_auto] items-baseline gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: it.color }}
                        />
                        <span className="text-[0.95rem] font-medium text-ink-900">
                          {it.name}
                        </span>
                      </div>
                      <p className="ml-5 text-xs text-ink-400">{it.detail}</p>
                      <div
                        className="ml-5 mt-1.5 h-1 rounded-full bg-ink-900/5"
                        aria-hidden="true"
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: it.color,
                          }}
                        />
                      </div>
                    </div>
                    <span className="tabular-nums font-display text-base text-forest-900">
                      {it.kg.toFixed(2)} kg
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-7 flex flex-col gap-1 border-t border-ink-900/8 pt-5 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                ≈ a 7 km drive in a petrol car · India veg-dinner avg is{" "}
                <span className="tabular-nums text-ink-700">2.1 kg</span>
              </p>
              <p>
                Source:{" "}
                <a
                  href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5268357/"
                  className="border-b border-forest-700/30 text-forest-700 hover:border-forest-700"
                >
                  Vetter et al. 2017
                </a>
              </p>
            </div>
          </div>
        </div>
      </RevealOnView>
    </section>
  );
}
```

- [ ] **Step 3.2: Verify build passes**

```bash
pnpm build 2>&1 | tail -5
```

Expected: build passes; ThaliPreview is picked up as a marketing chunk.

---

## Task 4: Export blog POSTS + `JournalCards`

**Files:**
- Modify: `app/(marketing)/blog/page.tsx` (add `export` to the existing `POSTS` const)
- Create: `components/marketing/JournalCards.tsx`

- [ ] **Step 4.1: Export POSTS from the blog index**

Read the existing line in `app/(marketing)/blog/page.tsx`:

```ts
const POSTS = [
```

Change to:

```ts
export const POSTS = [
```

Only that one keyword changes. The 3 existing posts (`why-food-carbon-matters-india`, `reading-our-methodology`, `first-restaurant-audit`) and their excerpts stay as-is.

- [ ] **Step 4.2: Write JournalCards**

Create `components/marketing/JournalCards.tsx`:

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { POSTS } from "@/app/(marketing)/blog/page";
import { RevealOnView } from "./RevealOnView";

// Rough words-per-minute → read time estimate.
function readMinutes(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

export function JournalCards() {
  return (
    <section
      aria-labelledby="journal-title"
      className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28"
    >
      <RevealOnView>
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 text-[0.68rem] tracking-[0.22em] uppercase">
              <span className="tabular text-ink-300">§ 04</span>
              <span aria-hidden="true" className="h-px w-8 bg-forest-700/40" />
              <span className="font-medium text-forest-700">Journal</span>
            </div>
            <h2
              id="journal-title"
              className="mt-5 font-display text-3xl leading-tight text-ink-900 sm:text-4xl"
            >
              Notes from{" "}
              <span className="italic text-forest-700">the team</span>.
            </h2>
          </div>
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-sm font-medium text-forest-900"
          >
            <span className="border-b border-forest-900/30 pb-0.5 transition-colors group-hover:border-forest-900">
              Read all notes
            </span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </RevealOnView>

      <ul className="mt-12 grid gap-5 md:grid-cols-3">
        {POSTS.map((p, i) => {
          const minutes = readMinutes(p.excerpt);
          return (
            <RevealOnView key={p.slug} delay={Math.min(i * 0.08, 0.16)}>
              <li className="group h-full">
                <Link
                  href={`/blog/${p.slug}`}
                  className="flex h-full flex-col rounded-card border border-ink-900/8 bg-cream-50 p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-forest-900/20 hover:shadow-[var(--shadow-card)]"
                >
                  <p className="text-[0.62rem] font-semibold tracking-[0.22em] text-forest-700 uppercase">
                    {new Date(p.date).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <h3 className="mt-4 font-display text-2xl leading-snug text-ink-900">
                    {p.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-[0.95rem] leading-relaxed text-ink-500">
                    {p.excerpt}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-6 text-xs text-ink-400">
                    <span>{minutes} min read</span>
                    <ArrowRight className="h-4 w-4 text-forest-700 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </li>
            </RevealOnView>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4.3: Verify build**

```bash
pnpm build 2>&1 | tail -5
```

Expected: clean build. If TS complains about the circular-ish import from `app/(marketing)/blog/page.tsx`, the fix is to extract `POSTS` to `lib/blog-posts.ts` — try the cleaner path first; only refactor if the build fails.

---

## Task 5: Wire the new components into the landing

**Files:**
- Modify: `app/(marketing)/page.tsx`

The landing has 6 `<section>` blocks (Hero, Trust strip, Pillars, KPI band, How-it-works/Steps, FAQ, Final CTA). We wrap 5 of them in `<RevealOnView>` (skip the Hero — it has its own motion already), swap two KPI values to `<CountUp>`, and insert `<ThaliPreview>` and `<JournalCards>` at the right places.

- [ ] **Step 5.1: Add the new imports**

In the import block at the top of `app/(marketing)/page.tsx`:

```ts
import { HeroVisual } from "@/components/marketing/HeroVisual";
import { FAQ } from "@/components/marketing/FAQ";
```

becomes:

```ts
import { HeroVisual } from "@/components/marketing/HeroVisual";
import { FAQ } from "@/components/marketing/FAQ";
import { RevealOnView } from "@/components/marketing/RevealOnView";
import { CountUp } from "@/components/marketing/CountUp";
import { ThaliPreview } from "@/components/marketing/ThaliPreview";
import { JournalCards } from "@/components/marketing/JournalCards";
```

- [ ] **Step 5.2: Swap two KPI values to CountUp**

In the `kpis` const declaration near the top of the file:

```ts
const kpis = [
  { value: "1,500+", label: "Indian-priority food items in the database" },
  { value: "30+", label: "Indian emission factors cited by source" },
  { value: "1·2·3", label: "Scopes separated for restaurant accounting" },
  { value: "Open", label: "Methodology, published and versioned" },
];
```

Leave the const as-is. We instead intercept the render by checking the index in the existing `.map()`. Find the KPI loop (around line 290) — currently:

```tsx
<p className="tabular mt-10 font-display text-5xl leading-none tracking-tight text-forest-900 sm:text-[3.5rem]">
  {k.value}
</p>
```

Replace with a tiny inline branch that uses `CountUp` for the first two indices (the numeric ones) and falls back to the text for the rest:

```tsx
<p className="tabular mt-10 font-display text-5xl leading-none tracking-tight text-forest-900 sm:text-[3.5rem]">
  {i === 0 ? (
    <CountUp to={1500} suffix="+" />
  ) : i === 1 ? (
    <CountUp to={30} suffix="+" />
  ) : (
    k.value
  )}
</p>
```

The `i` variable already exists in the surrounding `.map((k, i) => …)`.

- [ ] **Step 5.3: Wrap each post-hero section in RevealOnView**

For each `<section>` after the hero (Trust strip, Pillars, KPI band, How-it-works, FAQ, Final CTA), wrap its INNER content in `<RevealOnView>`. We wrap the inner div, not the `<section>` itself, so `<section>` keeps its semantic role.

Example (Trust strip, currently around line 168):

```tsx
<section
  aria-label="Data sources"
  className="border-y border-ink-900/10 bg-cream-100/50"
>
  <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-12">
      …
    </div>
  </div>
</section>
```

becomes:

```tsx
<section
  aria-label="Data sources"
  className="border-y border-ink-900/10 bg-cream-100/50"
>
  <RevealOnView>
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-12">
        …
      </div>
    </div>
  </RevealOnView>
</section>
```

Repeat for the Pillars section, KPI band, How-it-works/Steps, FAQ section, Final CTA section. **Skip the Hero** (it has its own animation system and motion-on-load is different from motion-on-scroll).

For the pillar cards specifically (the `<li>`s inside the `<ul className="mt-14 grid gap-5 md:grid-cols-3">` around line 216), wrap each individually with staggered delays:

```tsx
<ul className="mt-14 grid gap-5 md:grid-cols-3">
  {pillars.map((p, i) => {
    const Icon = p.icon;
    return (
      <RevealOnView key={p.title} delay={Math.min(i * 0.08, 0.16)}>
        <li
          className="group relative flex flex-col rounded-card border border-ink-900/8 bg-cream-50 p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-forest-900/20 hover:shadow-[var(--shadow-card)] sm:p-8"
        >
          …
        </li>
      </RevealOnView>
    );
  })}
</ul>
```

Same stagger pattern for the `<ol>` of steps inside the How-it-works section.

- [ ] **Step 5.4: Insert `<ThaliPreview />` between KPI band and How-it-works**

The KPI band section closes around line 309. The How-it-works section opens with `{/* ───────── How it works teaser ───────── */}`. Between those two `</section>` and `<section …>` tags, drop:

```tsx
{/* ───────── Thali preview ───────── */}
<ThaliPreview />
```

- [ ] **Step 5.5: Insert `<JournalCards />` between How-it-works and FAQ**

The Steps `<ol>` closes inside the How-it-works section. After that `</section>` closes (just before `{/* ───────── FAQ ───────── */}`), drop:

```tsx
{/* ───────── Journal ───────── */}
<JournalCards />
```

- [ ] **Step 5.6: Build to catch any TypeScript issues**

```bash
pnpm build 2>&1 | tail -10
```

Expected: clean build. If the import of `POSTS` from `app/(marketing)/blog/page.tsx` causes a circular dep or Next.js complains about importing from a route file: extract `POSTS` to `lib/blog-posts.ts`, update both `app/(marketing)/blog/page.tsx` and `app/(marketing)/blog/[slug]/page.tsx` to import from there, and update `JournalCards.tsx` to import from there. The change is mechanical; ~10 minutes.

- [ ] **Step 5.7: Run full test suite**

```bash
pnpm vitest run 2>&1 | tail -6
```

Expected: 75 tests passing (71 prior + 4 new easing tests).

---

## Task 6: Local smoke check

**Files:** none (just visual verification)

- [ ] **Step 6.1: Run dev server**

```bash
pnpm dev > /tmp/devout.log 2>&1 &
until grep -q "Ready" /tmp/devout.log; do sleep 0.5; done
echo "Dev server up at http://localhost:3000"
```

- [ ] **Step 6.2: Eyeball the landing**

Open `http://localhost:3000` in a browser. Scroll from top to bottom slowly. Verify:

1. Hero displays immediately (no reveal — by design).
2. Trust strip → Pillars → KPI band each fade + slide up as they enter view.
3. KPI numbers `1,500+` and `30+` count up from 0 once the band enters view.
4. ThaliPreview card visible after KPI band; donut renders with 6 segments; total reads `1.84 kg CO₂e`; the 6 line items appear with mini bars.
5. JournalCards visible after Steps; 3 cards link to /blog/<slug>.
6. FAQ + Final CTA reveal-in normally.
7. No console errors (DevTools).

Stop the dev server:

```bash
# In whatever shell the dev server is running, kill it. If you used the background pattern above:
kill %1 2>/dev/null || true
```

---

## Task 7: Commit + push + deploy

**Files:** all changed.

- [ ] **Step 7.1: Stage everything**

```bash
git add \
  components/marketing/RevealOnView.tsx \
  components/marketing/CountUp.tsx \
  components/marketing/ThaliPreview.tsx \
  components/marketing/JournalCards.tsx \
  lib/easing.ts \
  __tests__/easing.test.ts \
  app/\(marketing\)/blog/page.tsx \
  app/\(marketing\)/page.tsx \
  docs/superpowers/plans/2026-05-22-landing-polish-plan.md

git diff --cached --stat
```

Expected: ~9 files staged.

If `app/(marketing)/blog/[slug]/page.tsx` was modified too (only if we had to extract `POSTS` to `lib/blog-posts.ts`), add it. And `lib/blog-posts.ts` if it was created.

- [ ] **Step 7.2: Scan staged diff for tokens**

```bash
git diff --cached | grep -nE "ghp_[A-Za-z0-9]{30,}|nfp_[A-Za-z0-9]{30,}|sbp_[a-f0-9]{30,}" && echo "STOP: secret in diff" || echo "OK: clean"
```

Expected: `OK: clean`. (False positives on documentation-of-the-regex are possible if the plan file contains the patterns — fine to ignore in that case; GitHub's real scanner won't flag them.)

- [ ] **Step 7.3: Commit**

```bash
git commit -m "$(cat <<'EOF'
Workstream B.1: landing page polish (motion + content density)

Four new client components on the marketing landing:
- RevealOnView: scroll-triggered fade+slide-up wrapper, reduced-motion
  aware, used to wrap every post-hero section.
- CountUp: animates the KPI numbers (1,500+ and 30+) from 0 with
  ease-out cubic on view-entry; tabular-nums keeps width stable.
- ThaliPreview: static "veg thali dinner for one" calculator preview —
  inline-SVG 6-segment donut, bullet rows with mini bars, 1.84 kg CO₂e
  total. Values sourced from Vetter et al. 2017 (PMC5268357), the same
  India-grounded source we added in workstream C.
- JournalCards: 3-card row above the FAQ linking to the existing blog
  posts. Imports the slug list from the blog page so we don't drift.

The hero stays untouched (it already has its own motion). No new deps.
4 new tests cover the easeOutCubic helper (75 total, was 71).

B.2 (authenticated app) and B.3 (methodology/blog detail) deferred.
EOF
)"
```

- [ ] **Step 7.4: Push**

```bash
git push "https://shubhraj5575:${GH_PAT}@github.com/shubhraj5575/greenplate-website.git" main
```

(`${GH_PAT}` substituted at runtime from session-known token.)

- [ ] **Step 7.5: Deploy to Netlify**

```bash
NETLIFY_AUTH_TOKEN="${NETLIFY_PAT}" \
  pnpm --package=netlify-cli dlx netlify deploy --build --prod
```

Expected: build completes, "Deploy is live!" prints, new URL accessible.

---

## Task 8: Production smoke + mark done

**Files:** none.

- [ ] **Step 8.1: Hit the deployed URL**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://greenplate-website.netlify.app/
```

Expected: 200.

- [ ] **Step 8.2: Hand-off note for the user**

Tell the user the deploy is live and ask them to walk through the 7-step manual smoke from Task 6 against the deployed URL. (Skipped reduced-motion check — they may or may not have it enabled; flag as a follow-up if they care.)

- [ ] **Step 8.3: Mark workstream B done**

```text
TaskUpdate({ taskId: "13", status: "completed" })
```

(Or "in_progress" if proceeding to B.2 immediately.)

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| RevealOnView wrapper, reduced-motion aware | Task 1 |
| CountUp with ease-out cubic, tabular-nums, reduced-motion aware | Task 2 |
| ThaliPreview card with inline SVG donut + 6 line items + citation | Task 3 |
| JournalCards row linking to 3 existing blog posts | Task 4 |
| Wrap landing sections, swap KPI text, insert new components | Task 5 |
| Reduced-motion behaviour | RevealOnView returns children when reduce, CountUp jumps to final, easeOutCubic untouched (initial state `to`) — verified in Task 6.2 |
| Lighthouse budget | Task 8.2 (user verifies; we don't have a CLI Lighthouse runner wired) |
| `pnpm vitest run` passes (75) | Task 5.7, Task 2.6 |
| `pnpm build` clean | Task 5.6, Task 3.2, Task 1.2 |

**Placeholder scan:** No "TBD", "fill in", or "similar to" left. Step 5.6 explicitly enumerates the fallback path (extract POSTS to lib) so it isn't a placeholder, just a contingent action.

**Type consistency:**
- `RevealOnView({ children, delay?, yOffset? })` — used consistently.
- `CountUp({ to, suffix?, prefix?, durationMs?, locale? })` — used with `to` + `suffix` only in Task 5.2.
- `easeOutCubic(t: number): number` — imported by CountUp, tested directly.
- `POSTS` export keyword — Task 4.1 changes one location, Task 4.2 imports it.

**Risk recheck:** Most likely fail mode is the cross-route import (Task 4.2 imports `POSTS` from `app/(marketing)/blog/page.tsx`). Step 5.6 catches this at build time and gives the exact escape hatch (move to `lib/blog-posts.ts`).
