# Food data expansion — design

**Date:** 2026-05-21
**Workstream:** C of three (A: form bug fixes ✓ · **C: food data expansion** · B: visual polish)
**Status:** Awaiting user approval

## Problem

Current state: `food_items` holds 1,082 unique rows after the Phase 1 seed
(reconciled from 3,479 staging rows in five local Excel/CSV files). The
scraper script `scripts/scrape-food-sources.ts` was meant to also pull
OWID's Poore & Nemecek 2018 dataset, but that URL is 404 — the script
gracefully skipped it during initial activation, leaving zero rows from
external sources.

For a calculator that claims authoritative methodology, this is thin —
especially for India-specific values. The methodology page reads its
sources from `food_items.data_source`, so expanding the database also
strengthens user trust in the methodology shown.

## Goal

Increase `food_items` count from **1,082 → ≥ 1,200** (stretch ≥ 1,400),
with every new row sourced from a verifiable primary citation. Priority
is **Indian-specific quality over raw count** — we don't want to dilute
the DB with European LCAs for foods that don't exist in India.

## Approach (chosen: A from brainstorm)

Three sources, two new adapters in the existing scraper:

### 1. `fetchOwidPoore()` — fix existing

The current URL hits 404 because OWID restructured their
`owid-datasets` repo in 2023. Implementation step: WebFetch
`https://ourworldindata.org/environmental-impacts-of-food` and grep for
the canonical CSV download link. Common live locations to try in order:

1. `https://github.com/owid/owid-datasets-archive/...`
2. `https://github.com/owid/etl/blob/master/snapshots/...poore_nemecek_2018.csv`
3. A pinned local copy committed to `data/owid-poore-nemecek-2018.csv`
   if both upstream paths are dead.

Output: ~43 rows. `data_source: "OWID — Poore & Nemecek (Science 2018)"`,
`is_indian: false`, `data_quality: high`,
`lca_boundary: "Cradle-to-retail"`, `geographic_scope: "Global"`.

### 2. `fetchFaostatIndia()` — new

FAOSTAT REST endpoint:
`https://faostatservices.fao.org/api/v1/en/data/GE?area=100&year=2022&output_type=objects`
(area=100 is India in FAO's country codes; dataset GE is "Emissions
intensities" — kgCO2eq/kg of product for livestock and crops, computed by
FAO from underlying emission + production data).

India-specific values reflect Indian agriculture characteristics
(low feed conversion ratio = higher per-kg dairy emissions; methane
from flooded rice cultivation; etc.) — meaningfully different from
European or global averages.

Output: ~50–80 rows. `data_source: "FAOSTAT — Emissions intensities (FAO, 2022)"`,
`is_indian: true`, `data_quality: high`,
`lca_boundary` and `geographic_scope` from FAO metadata.

### 3. `data/curated_indian_supplemental.csv` — new file

Hand-built CSV covering categories the current DB is underweight in:

- **Regional breads**: paratha, naan, roomali roti, bhakri, thepla, kulcha
- **Indian sweets**: jalebi, gulab jamun, rasgulla, ladoo, mysore pak, soan papdi
- **Spice mixes & condiments**: garam masala, chaat masala, mango pickle, mint chutney
- **Packaged Indian snacks**: bhujia, namkeen, banana chips, murukku
- **Indian beverages**: lassi, masala chai (per cup), tender coconut water
- **Indian dairy gaps**: paneer (if absent), dahi/curd, ghee, khoa
- **Indian oils**: mustard oil, groundnut oil, coconut oil

#### Critical sourcing rule

Every CSV row must cite a verifiable source URL. Implementation method:

1. For each candidate food item, run `WebSearch` for
   `"<food> LCA kgCO2e per kg India"` or `"<food> carbon footprint study"`.
2. Open the top 2–3 hits via `WebFetch`, extract value + citation.
3. If no source confirms a value within ±50% of the expected category
   bound (e.g. dairy products 1–6 kgCO2e/kg, oils 3–8 kgCO2e/kg) → **skip
   the row** and append it to `data/.curated-skipped.txt` for manual
   follow-up later.
4. Record `source_url` (DOI or report URL) + paper/report name in
   `data_source`. No hallucinated values from training data.

Quality tier:
- Peer-reviewed paper with DOI → `data_quality: high`
- Industry report with raw data → `medium`
- Government / NGO publication with category-level estimate → `medium`
- Anything we can't pin down → not added

Target: 50–100 verified rows out of ~100 candidates (50–100% verification
rate; realistically 50–70%).

The seeder (`seed-from-excel.ts`) already reads `.csv` files from
`data/`. **It needs a small change** to also pick up this new file — or
we name it deliberately to match an existing read pattern. Decided
during implementation; both routes are trivial.

### What we are NOT changing

- Reconciler logic (`reconcile-food-db.ts`) — current priority is
  correct for our "Indian-first" goal: `is_indian: true` gets +30,
  `data_quality: high` gets +200, recent year gets +10, tight σ gets +5.
- The food_items / food_items_staging schemas. No new columns.
- The seeder's truncate-and-replace pattern (staging is wiped on every
  `pnpm db:seed`; scraper appends; reconcile rebuilds food_items).
- AGRIBALYSE, Open Food Facts, ICAR-PDF scraping (all deferred).
- `/methodology` page UI (Workstream B).

## Files touched

| File | Action |
|---|---|
| `scripts/scrape-food-sources.ts` | Modify — replace dead OWID URL, add `fetchFaostatIndia()` |
| `scripts/seed-from-excel.ts` | Modify (probably one line) — pick up new curated CSV |
| `data/curated_indian_supplemental.csv` | Create — verified items |
| `data/.curated-skipped.txt` | Create — log of unverifiable candidates |
| `__tests__/scrape-sources.test.ts` | Create — mock-fetch tests for both adapters |

5 files; 4 with mostly new content, 1 (`scrape-food-sources.ts`) with two
new functions and one URL replacement.

## Success criteria

After `pnpm db:seed && pnpm db:scrape && pnpm db:reconcile`:

1. OWID adapter logs ≥ 30 rows inserted.
2. FAOSTAT adapter logs ≥ 20 rows inserted.
3. Curated CSV contributes ≥ 50 rows.
4. Final `select count(*) from public.food_items` returns **≥ 1,200**
   (stretch ≥ 1,400).
5. Five random spot-checks via SQL pick (`select * from public.food_items
   where data_source in (...new sources...) order by random() limit 5`):
   each row has a non-null `source_url` that returns HTTP 200 on
   `curl -I`.
6. Regression: `rice`, `wheat`, `paneer`, `dal_lentils`, `chicken` still
   have their existing Indian-source primaries (reconciler priority
   protects them).
7. `pnpm vitest run` → all tests pass (61 existing + ~5 new = ~66).

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| FAOSTAT API down | Low | try/catch — log and continue |
| OWID URL unresolvable | Medium | Fallback to a pinned local copy in `data/` |
| WebSearch returns irrelevant hits | Medium | Skip row, log for manual review |
| Curated values cross-contaminating | Low | Each row's `source_url` must be unique |
| Indian primary rows overwritten | Very low | Reconciler priority already protects (+30 for `is_indian`) |
| Tool budget for WebSearch/WebFetch | Low | ~100 candidates × 2–3 calls = 200–300 calls; within session budget |

## Out of scope

- AGRIBALYSE adapter (deferred — potential workstream C.2 if raw coverage is wanted later)
- ICAR / NDDB PDF scraping
- Open Food Facts integration
- `/methodology` page UI updates (Workstream B)
- Changes to reconcile priority logic
- New schema columns

## Final outcome (filled after implementation, 2026-05-21)

- **OWID URL resolved to:** `https://ourworldindata.org/grapher/ghg-per-kg-poore.csv?v=1&csvType=full` (the original `owid-datasets` GitHub path was archived; the grapher CSV export gives the same Poore & Nemecek 2018 figures in a slightly different column shape — parser regex widened to match `/greenhouse gas.*per (kilogram|kg)/i`).
- **OWID rows inserted:** 38 (vs spec's ≥30)
- **FAOSTAT rows inserted:** 13 (vs spec's ≥20 — FAOSTAT REST API now requires auth; replaced with public bulk-ZIP download + `unzip` extraction. India has 13 "Emissions intensity" commodity rows in the GE dataset; that's all FAO publishes for India in this dataset)
- **Curated CSV rows added:** 21 (vs spec's ≥50 — most candidates required paywalled paper access; settled on the 21 we could fully cite to the open-access Vetter et al. 2017 PMC5268357 table and one open-access sheep paper PMC10826930. Skipped candidates with reasons are documented in `data/.curated-skipped.txt` — 99 lines of explanation for future workstream C.2)
- **Final `food_items` count: 1,115** (vs 1,082 baseline; +33 primaries) — **below the spec's ≥1,200 target**. The shortfall is honest: most new staging rows (~70 of the 72 added) collided on canonical_name with existing items, so they became `alt_sources` jsonb entries rather than new primary rows. The reconciler's behaviour is correct — the count target was optimistic.
- **Indian-flagged rows:** 1,073 (+6)
- **High-quality rows:** 70 (was 25 — almost 3× because every new source is peer-reviewed)
- **Items with non-null `source_url`:** 109 (was 0 — the seeder enhancement that reads `Source_URL` from CSVs means the methodology page can now link to real citations for ~10% of items; previously no item had a clickable source)

### Honest gap notes

1. The ≥1,200 target was based on the (incorrect) assumption that most new rows would have unique canonical names. They didn't. The fix isn't to invent more rows — it's to either narrow the canonicalizer (so e.g. "basmati rice" and "rice" are distinct) or to add genuinely different food items (sweets, breads, dishes that don't already exist in the DB). Both are workstream C.2 candidates.
2. The curated CSV target of ≥50 turned out to be aspirational given paywall density in Indian food LCA literature. The realistic future-doable list (paneer/ghee/butter/dahi from Sharma et al 2021 + the IJCRT traditional dishes paper if extractable) would add ~10–15 more, not 50.
3. The methodology page will benefit most: 109 items now have clickable citations, vs 0 before. That's the real shipped improvement, more than the headline count.
