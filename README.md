# GreenPlate v2

Carbon footprint measurement for India's food sector. Two journeys (individual + food-service organization), real LCA data, no greenwashing.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (CSS-first design tokens in `app/globals.css`)
- **Supabase** — Postgres + Auth (Google OAuth) + RLS — project `qbslqlmmslaetylafxup`
- **Fonts:** Inter (UI) + Fraunces (display) via `next/font`
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **Testing:** Vitest

## Local development

```bash
cp .env.example .env.local      # fill in Supabase keys
pnpm install
pnpm dev                        # http://localhost:3000
pnpm test                       # vitest
pnpm typecheck
```

## Project layout

```
app/
  (marketing)/    # public — landing, methodology, blog, about
  (auth)/         # login + onboarding
  (app)/          # auth-gated — dashboard, calculate, org/*, history, settings
  api/auth/callback/route.ts
components/
  ui/             # primitives
  marketing/      # hero, feature grid, footer
  calc/           # wizard steps, summary cards
  dashboard/      # charts, KPIs
lib/
  supabase/       # browser + server clients, middleware
  calc/           # pure calculation engines (individual, organization)
  equivalents.ts  # trees, car km, etc.
  india-benchmarks.ts
content/blog/     # MDX posts
scripts/          # seed + scrape data
supabase/migrations/
```

## Methodology

Every emission factor cites a source on `/methodology`. See `lib/calc/factors.ts` for the canonical reference. India-specific factors (CEA grid, ICAT transport, PNGRB gas) take precedence over global defaults where available.

## Phases

This codebase is built in phases (see project root `GreenPlate v2 — Build Plan`):

- Phase 0 — foundation (this commit)
- Phase 1 — DB schema, seed scripts, scrapers
- Phase 2 — auth (Google OAuth)
- Phase 3 — marketing pages
- Phase 4 — individual calculator
- Phase 5 — org calculator + menu analyzer
- Phase 6 — dashboards + history + settings
- Phase 7 — polish + deploy (Netlify)
