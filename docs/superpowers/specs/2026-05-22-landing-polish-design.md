# Landing page polish (B.1) — design

**Date:** 2026-05-22
**Workstream:** B.1 of Workstream B (visual + interaction polish).
B.2 = authenticated app polish (deferred). B.3 = methodology/blog (deferred).
**Status:** Awaiting user approval

## Problem

The landing page at `app/(marketing)/page.tsx` is structurally complete
(hero, trust strip, pillars, KPI band, steps, FAQ, footer; 605 lines)
and has thoughtful typography + a custom hero illustration. But static
sections "appear" on scroll rather than feeling alive, the KPI numbers
sit as text strings, and the existing blog posts and a clear example of
what the calculator produces are absent from the front door.

For a site that should feel "year-old and lived-in", the page needs:

1. Subtle on-scroll motion that signals craft.
2. Animated counter on the headline KPIs.
3. A real, branded sample of what the calculator outputs — the
   "show, don't tell" moment.
4. A surfaced link to the three existing blog posts (currently buried
   in `/blog`).

## Goal

After this workstream:

- Scrolling the landing on a modern desktop browser feels deliberate —
  sections fade + slide in once as they enter view.
- The `1,500+` and `30+` KPI numbers count up from 0 when their section
  enters view (~1.2s, ease-out cubic, width-stable via tabular-nums).
- A new "Indian veg thali · dinner for one" card sits between the KPI
  band and the Steps section. It shows a 6-segment donut + a bullet
  breakdown + a citation, totaling **1.84 kg CO₂e**.
- A new 3-card "Journal" row sits above the FAQ, linking to the existing
  `/blog/<slug>` posts (why-food-carbon-matters-india,
  reading-our-methodology, first-restaurant-audit).
- All animations respect `prefers-reduced-motion`.
- Lighthouse mobile score stays within 3 points of baseline.

## Approach (chosen: A from brainstorm — motion + content blocks)

### 1. Reveal wrapper

A new client component `components/marketing/RevealOnView.tsx` that
wraps content in framer-motion's `motion.div` with `whileInView`,
`viewport={{ once: true, margin: "-80px" }}`, opacity 0→1 + y 24→0,
0.55s duration, eased with `[0.22, 0.61, 0.36, 1]`. Returns the bare
children when `useReducedMotion()` is true. Accepts a `delay` prop for
stagger.

Wrap each landing-page section in it. For pillar cards specifically,
stagger via `delay={i * 0.08}`, capped at `0.16s` for the third card.

### 2. CountUp component

A new client component `components/marketing/CountUp.tsx`. Props:
`to: number`, `suffix?: string`, `durationMs?: number = 1200`.
Uses framer-motion's `useInView` to detect entry; on entry, runs a
`requestAnimationFrame` loop that interpolates from 0 to `to` with
`easeOutCubic`. Renders inside a `<span className="tabular-nums">` so
the width doesn't jiggle as digits change. Respects reduced-motion by
jumping straight to `to`.

Wired into the existing KPI band: `1,500+`→`<CountUp to={1500} suffix="+" />`,
`30+`→`<CountUp to={30} suffix="+" />`. `1·2·3` and `Open` stay
unchanged (not numeric).

### 3. ThaliPreview card

A new component `components/marketing/ThaliPreview.tsx` showing a
sample calculator output. Static — no DB call. The breakdown is
hardcoded but every value comes from the food_items table we just
expanded (Vetter et al. 2017 PMC5268357 farm-gate values, scaled by
serving size).

Breakdown (1.84 kg CO₂e total for one veg thali, dinner serving):

| Component | Serving | kg CO₂e |
|---|---|---|
| Rice | 100 g cooked | 0.70 |
| Toor dal | 50 g uncooked | 0.41 |
| Mixed sabzi (potato + tomato + onion + spinach) | 150 g | 0.33 |
| Chapati × 2 (60 g atta) | 60 g wheat flour | 0.22 |
| Dahi | 100 g | 0.12 |
| Jaggery | 20 g | 0.06 |
| **Total** | | **1.84** |

Layout:

```
┌──────────────────────────────────────────────────┐
│  Indian veg thali · dinner for one               │
│                                                   │
│   ╭──[6-segment donut, brand colors]              │
│   │   1.84 kg CO₂e (large display number)         │
│   ╰── per person, this meal                       │
│                                                   │
│  ─────── breakdown ───────                        │
│  Rice (100 g cooked)  0.70 kg ──────              │
│  Dal toor (50 g)      0.41 kg ────                │
│  Mixed sabzi (150 g)  0.33 kg ───                 │
│  Chapati × 2          0.22 kg ──                  │
│  Dahi (100 g)         0.12 kg ─                   │
│  Jaggery (20 g)       0.06 kg ─                   │
│                                                   │
│  ≈ a 7 km drive in a petrol car                   │
│  Source: Vetter et al. 2017 (PMC5268357)          │
└──────────────────────────────────────────────────┘
```

**Donut implementation**: tiny inline SVG (~30 lines), not Recharts.
Six segments around a 220-radius circle with the existing brand colors
(forest-900, forest-700, forest-500, leaf-500, amber-400, ink-500).
Why inline SVG: avoids pulling Recharts into the marketing bundle (~150
KB) for a static 6-segment donut.

### 4. JournalCards row

A new component `components/marketing/JournalCards.tsx`. Reads the
three known blog slugs from `content/blog/` (or, simpler, hardcodes
them as a const array — they're already enumerated in the marketing
build output we saw):

```ts
const posts = [
  {
    slug: "why-food-carbon-matters-india",
    title: "Why food carbon matters in India",
    readMin: 6,
  },
  {
    slug: "reading-our-methodology",
    title: "Reading our methodology",
    readMin: 4,
  },
  {
    slug: "first-restaurant-audit",
    title: "First restaurant audit, in Mumbai",
    readMin: 8,
  },
];
```

Renders a section labelled `JOURNAL · FROM THE TEAM` (matching the
existing `SectionLabel` pattern from the page) and a 3-card grid.
Cards are styled like the pillar cards (border, hover-lift) but lighter
on internal content (just title + read-time + arrow). Each links to
`/blog/<slug>`.

### What we are NOT changing

- The hero (HeroVisual stays as-is — it's already excellent)
- The Nav (scroll-blur backdrop is fine)
- The Footer (B.3 candidate for richness)
- The pillar cards (already have hover lift; just wrap in RevealOnView)
- The Steps section (already structured well)
- The FAQ
- The trust strip (text-only sources — a logo treatment is B.3)
- Any new brand colors or typography changes
- Mobile-specific layout (existing responsive holds up)

## Files touched

| File | Action |
|---|---|
| `components/marketing/RevealOnView.tsx` | Create |
| `components/marketing/CountUp.tsx` | Create |
| `components/marketing/ThaliPreview.tsx` | Create |
| `components/marketing/JournalCards.tsx` | Create |
| `app/(marketing)/page.tsx` | Modify — wrap sections, swap KPI text for `<CountUp>`, insert `<ThaliPreview>` between KPI band and Steps, insert `<JournalCards>` between Steps and FAQ |
| `__tests__/countup.test.ts` | Create — 3 tests for `easeOutCubic` |

6 files; 5 new components/tests + 1 page modification.

## Success criteria

After deploy to https://greenplate-website.netlify.app/:

1. **Section reveals.** Open in a fresh tab on a wide screen. Scroll
   slowly. Each section (Trust strip → Pillars → KPI band → ThaliPreview
   → Steps → JournalCards → FAQ) fades + slides in once as it enters
   the viewport. No flicker on refresh.
2. **KPI counter.** The `1,500+` and `30+` numbers in the KPI band tick
   up from 0 over ~1.2s when the band scrolls into view. Width stays
   constant (tabular-nums).
3. **ThaliPreview.** Renders a 6-segment donut, total `1.84 kg CO₂e`,
   the 6 line items, the offset comparison line, and the citation. No
   network call (static).
4. **JournalCards.** 3 cards rendered above the FAQ. Clicking each
   navigates to the corresponding `/blog/<slug>` page and the article
   loads.
5. **Reduced motion.** With OS-level "Reduce motion" enabled, the page
   shows all content without animations on initial load (no opacity
   fade, no counter, no slide).
6. **Lighthouse.** Mobile Performance score on the deployed URL stays
   within 3 points of the current baseline (we'll snapshot baseline
   before deploy).
7. **Tests.** `pnpm vitest run` → 71 + 3 new = 74 passing.
8. **Build.** `pnpm build` clean.

## Risks

| Risk | Mitigation |
|---|---|
| `whileInView` flakes on iOS Safari | `viewport={{ once: true }}` is well-supported; if reveal stutters, widen the margin to `-40px` or use IntersectionObserver directly |
| ThaliPreview's hardcoded numbers drift from food_items DB | Source citation makes the value defensible; reviewer can update the const-block in 5 min if values change |
| Inline SVG donut math is off | The donut is a standard `circle` with `stroke-dasharray` per arc; same pattern as HeroVisual already uses |
| Page bundle grows past First Load JS budget | Net new code is small (~200 lines across 4 components + page edits). No new deps. |
| Stagger on pillar cards feels too slow | Cap delay at 0.16s for card 3 |

## Verification before completion

`pnpm vitest run` must pass. `pnpm build` must pass. Deploy via
`netlify deploy --build --prod`. Then the 8-step manual smoke above.
No success claim before the manual smoke is run by a human.

## Out of scope

- Authenticated app polish (B.2)
- Methodology / blog page redesign (B.3)
- Newsletter signup
- Real testimonials (no source content)
- New brand colors
- Source-logo treatment (text → logos)
- Photographic content
- Print styles
- Footer redesign
