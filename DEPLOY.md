# Deploy — GreenPlate v2

The codebase is feature-complete locally. To bring it online, complete the steps below in order. Each step lists the credential or external action required.

---

## 0. Push to GitHub

Local commits are ready on `main`. The remote isn't set yet. From the project root:

```bash
git remote add origin git@github.com:shubhraj5575/greenplate-website.git
git push -u origin main
```

**Needed from you:** a GitHub PAT or SSH key authorized to push to `shubhraj5575/greenplate-website`. If the repo doesn't exist yet, create it (empty, no README) at https://github.com/new.

---

## 1. Supabase — apply migrations + seed factors

Migrations live in `supabase/migrations/`:

1. `20260521120000_init.sql` — extensions, enums, all tables, triggers
2. `20260521120100_rls.sql` — RLS policies
3. `20260521120200_seed_factors.sql` — curated India emission factors

**Option A — Supabase dashboard SQL editor:** open each migration file, paste into the SQL editor at https://supabase.com/dashboard/project/qbslqlmmslaetylafxup/sql, run in order.

**Option B — Supabase CLI:**

```bash
brew install supabase/tap/supabase           # or curl-based install
supabase link --project-ref qbslqlmmslaetylafxup
supabase db push
```

**Needed from you:** for the CLI, your Supabase personal access token (Account → Access Tokens).

---

## 2. .env.local

Copy `.env.example` → `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://qbslqlmmslaetylafxup.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...           # from Supabase → Settings → API
SUPABASE_SERVICE_ROLE_KEY=eyJ...               # same page, "service_role" key
NEXT_PUBLIC_SITE_URL=http://localhost:3000     # change to prod domain when deploying
```

**Needed from you:** the anon and service-role keys from https://supabase.com/dashboard/project/qbslqlmmslaetylafxup/settings/api.

---

## 3. Seed the food database

With `.env.local` populated, run the three scripts in order:

```bash
pnpm db:seed       # 5 local files → food_items_staging + reference_menu_items
pnpm db:scrape     # OWID Poore & Nemecek → food_items_staging
pnpm db:reconcile  # staging → food_items (dedup by canonical_name)
```

Expected outcome: ~2,000–2,500 staging rows → ~1,500+ unique `food_items`. Browse at https://supabase.com/dashboard/project/qbslqlmmslaetylafxup/editor

The other public sources (DEFRA, AGRIBALYSE, FAOSTAT, Open Food Facts) are stubbed in `scripts/scrape-food-sources.ts` — add the relevant fetchers there when ready.

---

## 4. Google OAuth setup

The `/login` page expects Google OAuth wired up in Supabase Auth.

1. In Google Cloud Console (https://console.cloud.google.com/apis/credentials), create an **OAuth 2.0 Client ID**, type **Web application**.
2. Authorized redirect URI: `https://qbslqlmmslaetylafxup.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client Secret**.
4. In Supabase: Authentication → Providers → Google → enable → paste both → save.
5. Also set the Site URL and Redirect URLs in Authentication → URL Configuration to include your prod domain.

**Needed from you:** access to your Google Cloud Console project and Supabase dashboard.

---

## 5. Local smoke test

```bash
pnpm dev    # http://localhost:3000
```

Walk through:

1. Visit `/` — landing renders, hero CTAs work.
2. Click "Calculate" → bounces to `/login` → Google sign-in → `/onboarding`.
3. Choose **Individual**, enter name + city, submit.
4. Land on empty-state dashboard.
5. Run `/calculate` wizard with sample inputs:
   - 300 kWh electricity, 1 LPG cylinder, 150 L water
   - 100 km/week car (petrol mid), 0 flights
   - Non-veg regular
   - Med clothing/electronics, 5 kg waste/week, no composting
6. Submit → dashboard shows total (~6.5 t/yr household, ~2.2 t/capita) + donut + equivalents.
7. Sign out, sign in with a different Google account, pick **Organization**, name it "Test Cafe", run `/org/calculate` with a few menu items.

---

## 6. RLS verification

In the Supabase SQL editor, set the role to a logged-in user and try to read another user's data:

```sql
-- Should return 0 rows when run as user A trying to read user B's calculations
select * from calculations where user_id = '<some-other-uuid>';
```

---

## 7. Deploy to Netlify (or Vercel)

Recommended: Netlify, since the user originally chose it.

```bash
brew install netlify-cli
netlify login
netlify init    # connect to the GitHub repo
netlify env:import .env.local
netlify deploy --prod
```

Or via the Netlify dashboard: New site → GitHub → select `shubhraj5575/greenplate-website` → build command `pnpm build` → publish dir `.next` → add env vars.

After deploy:
- Update `NEXT_PUBLIC_SITE_URL` to the production domain.
- In Supabase Auth → URL Configuration, add the prod domain to **Site URL** and **Redirect URLs**.
- Re-test the smoke test against prod.

**Needed from you:** Netlify account, decision on custom domain.

---

## What's intentionally deferred to a v2.x release

- Long-form blog post bodies (3 stubs ship; full MDX bodies arrive later).
- Long-form team page (about page placeholder).
- Profile / org editing UI in /settings (placeholder dump only).
- Food-database autocomplete in /org/menu (gated on Phase 1 data load).
- Additional scrapers: DEFRA, AGRIBALYSE, FAOSTAT, Open Food Facts, EPA SCGHG.
- Per-state India electricity factors.
- Multi-org per user (current schema is single owner per org).
- Sentry / analytics — add when you pick a vendor.
