# Supabase — GreenPlate v2

Project: `qbslqlmmslaetylafxup`

## Migrations

Located in `migrations/`, named with timestamp prefix (Supabase CLI convention):

1. `20260521120000_init.sql` — extensions (pgcrypto, citext, unaccent, pg_trgm), enums, all tables, triggers
2. `20260521120100_rls.sql` — Row-Level Security policies (profiles, orgs, food/factors public-read, calculations + menu_items owner-scoped)
3. `20260521120200_seed_factors.sql` — curated India-specific `emission_factors` rows with citations

Apply via the Supabase dashboard SQL editor, or with the Supabase CLI:

```bash
# one-time: link this folder to the project (uses your Supabase access token)
supabase link --project-ref qbslqlmmslaetylafxup

# push all pending migrations
supabase db push
```

## Seeders (food data)

Three Node scripts in `../scripts/` populate `food_items_staging`, `food_items`, and `reference_menu_items`:

```bash
pnpm db:seed      # local Excel/CSV files → food_items_staging + reference_menu_items
pnpm db:scrape    # public datasets (OWID Poore & Nemecek) → food_items_staging
pnpm db:reconcile # food_items_staging → food_items (dedup by canonical_name)
```

All three require `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

## Backend safety

- `food_items_staging` has **no RLS policies** — meaning anon/authenticated clients cannot read it. The service role bypasses RLS.
- `food_items` + `emission_factors` + `reference_menu_items` are public-read but write-only via service role.
- `profiles`, `organizations`, `calculations`, `menu_items` are owner-scoped via `auth.uid()`.
- `contact_submissions` is insert-only for public, read-only for service role.
