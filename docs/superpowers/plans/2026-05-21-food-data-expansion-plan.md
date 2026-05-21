# Food data expansion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow `food_items` from 1,082 → ≥ 1,200 unique rows (stretch ≥ 1,400), all with verified primary citations, prioritizing Indian-specific data quality over raw count.

**Architecture:** Three new sources flow through the existing two-stage pipeline (sources → `food_items_staging` → `reconcile` → `food_items`). Two new adapter functions in the scraper plus one new curated CSV file are the only new inputs. The reconciler is untouched (its existing priority logic already protects Indian primaries).

**Tech Stack:** Node.js 22 · TypeScript 5 · `tsx` · Papa Parse · `@supabase/supabase-js` (admin client) · Vitest 4 · WebFetch / WebSearch for curation.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `scripts/scrape-food-sources.ts` | Modify | Replace dead OWID URL with a working CSV location (with a pinned-fallback path); add `fetchFaostatIndia()` function; call both from `main()` with try/catch each. |
| `data/curated_indian_supplemental.csv` | Create | Versioned, in-repo CSV of hand-verified Indian-specialty foods. Same column shape the seeder's `rowFromUniformCsv` already understands. |
| `data/.curated-skipped.txt` | Create (and gitignore) | Log of candidates that couldn't be verified. Useful for future manual curation. |
| `scripts/seed-from-excel.ts` | Modify | Add a sixth read step that picks up the curated CSV from the repo-local `data/` folder. |
| `__tests__/scrape-sources.test.ts` | Create | Mock-fetch unit tests for OWID parser + FAOSTAT parser. |
| `docs/superpowers/specs/2026-05-21-food-data-expansion-design.md` | Modify (at end of task 5) | Amend with the actual final count and the resolved OWID URL. |

All other files stay as-is. The reconciler is unchanged.

---

## Task 1: Fix the OWID URL

**Files:**
- Modify: `scripts/scrape-food-sources.ts` (the `OWID_CSV` constant near line 39 and `fetchOwidPoore()` if URL discovery changes the parsing)

- [ ] **Step 1.1: Resolve the live OWID dataset URL**

The current URL `https://raw.githubusercontent.com/owid/owid-datasets/master/datasets/Environmental%20impacts%20of%20food%20-%20Poore%20%26%20Nemecek%20(2018)/...csv` is 404. Run, in order, until one returns HTTP 200:

```bash
# Candidate 1: archived owid-datasets repo
curl -sI "https://raw.githubusercontent.com/owid/owid-datasets-archive/master/datasets/Environmental%20impacts%20of%20food%20-%20Poore%20%26%20Nemecek%20(2018)/Environmental%20impacts%20of%20food%20-%20Poore%20%26%20Nemecek%20(2018).csv" | head -1

# Candidate 2: OWID etl snapshots (most likely current location)
curl -sI "https://catalog.ourworldindata.org/garden/agriculture/2021-11-17/environmental_impacts_of_food/environmental_impacts_of_food.csv" | head -1

# Candidate 3: the OWID grapher data export
curl -sI "https://ourworldindata.org/grapher/food-emissions-supply-chain.csv?v=1&csvType=full" | head -1
```

Note which candidate returns `HTTP/2 200`. If **none** do, run a WebFetch (or browser) on `https://ourworldindata.org/environmental-impacts-of-food`, search the page for `.csv` links, and try the discovered URL.

If even that fails: download the dataset manually from `https://ourworldindata.org/grapher/food-emissions-supply-chain` via the "Download" button into `greenplate-website/data/owid-poore-nemecek-2018.csv`, and the adapter reads the local file via `fs.readFileSync` instead of `fetch`.

- [ ] **Step 1.2: Update `OWID_CSV` constant**

Open `scripts/scrape-food-sources.ts` and replace the `OWID_CSV` constant block (currently lines 39-42):

```ts
// CURRENT:
const OWID_CSV =
  "https://raw.githubusercontent.com/owid/owid-datasets/master/datasets/" +
  "Environmental%20impacts%20of%20food%20-%20Poore%20%26%20Nemecek%20(2018)/" +
  "Environmental%20impacts%20of%20food%20-%20Poore%20%26%20Nemecek%20(2018).csv";
```

with the resolved URL from step 1.1, e.g.:

```ts
const OWID_CSV =
  "https://catalog.ourworldindata.org/garden/agriculture/2021-11-17/environmental_impacts_of_food/environmental_impacts_of_food.csv";
```

(Replace with whichever candidate succeeded.)

- [ ] **Step 1.3: Sanity-check the new URL fetches a CSV**

```bash
curl -s "<resolved-url>" | head -3
```

Expected: first line is a CSV header containing `food_emissions` or `entity` columns. If the header doesn't match what `fetchOwidPoore()` looks for (`ghgCol` is found via `/food emissions/i` or `/ghg emissions per kg/i`; `foodCol` via `/^entity$/i` or `/^food/i`), record the actual header column names — you may need to widen the regex in step 1.4.

- [ ] **Step 1.4: (Conditional) Update column-detection regex in `fetchOwidPoore`**

Only if step 1.3 shows the header changed. Find this block (around lines 56-59):

```ts
const ghgCol = header.findIndex((h) =>
  /food emissions/i.test(h) || /ghg emissions per kg/i.test(h),
);
const foodCol = header.findIndex((h) => /^entity$/i.test(h) || /^food/i.test(h));
```

Widen the regex to include the actual column name observed in step 1.3. Example if the column is now called `ghg_per_kg`:

```ts
const ghgCol = header.findIndex((h) =>
  /food emissions/i.test(h) || /ghg emissions per kg/i.test(h) || /ghg_per_kg/i.test(h),
);
```

If step 1.3 already showed the original regex matches, **skip this step**.

- [ ] **Step 1.5: Smoke-test the adapter in isolation**

```bash
cd greenplate-website
NODE_OPTIONS='--enable-source-maps' tsx -e '
import { admin } from "./scripts/lib/admin-client.js";
// Re-export the function for ad-hoc invocation
import("./scripts/scrape-food-sources.ts").then(m => {
  // The function is not exported; call via importing the file:
  // Easier: just run the full scraper.
});
' 2>&1 | tail -10
```

Easier: just run the full scraper (it's idempotent — staging gets re-truncated on next seed):

```bash
pnpm db:scrape 2>&1 | grep -E "OWID|FAOSTAT|Total scraped"
```

Expected: `+ NN rows` where NN ≥ 30 (Poore & Nemecek has 43 commodities). If it logs `OWID fetch 404 — skipping`, the URL is wrong; loop back to 1.1.

- [ ] **Step 1.6: Run scraper test to confirm parser still passes (no parser tests exist yet — proceed)**

```bash
pnpm vitest run
```

Expected: 61 tests pass (unchanged; OWID adapter isn't tested yet — that's Task 5).

---

## Task 2: Add `fetchFaostatIndia()` adapter

**Files:**
- Modify: `scripts/scrape-food-sources.ts` (add new function + call in `main()`)

- [ ] **Step 2.1: Probe the FAOSTAT API to confirm shape**

```bash
curl -s "https://faostatservices.fao.org/api/v1/en/data/GE?area=100&year=2022&output_type=objects" | python3 -m json.tool | head -40
```

Expected: a JSON object with a top-level `data` array. Each row looks roughly like:

```json
{
  "Domain Code": "GE",
  "Area": "India",
  "Element": "Emissions intensity",
  "Item Code (CPC)": "...",
  "Item": "Milk, whole fresh cow",
  "Year": 2022,
  "Unit": "kg CO2eq/kg product",
  "Value": 2.71,
  "Flag Description": "Estimated value"
}
```

If the API responds 404 / 503 / returns wrapper errors, retry with `year=2021`. If still nothing, FAOSTAT is down — document and skip this task (the adapter still gets added but logs gracefully).

If the JSON shape is wildly different (field names changed), record the actual keys; adjust the parser in step 2.3.

- [ ] **Step 2.2: Write the failing test**

Create `__tests__/scrape-sources.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// We import the script for its side effects — but the adapter functions
// are not exported. So we duplicate just the FAOSTAT parser as a test
// fixture below, and the production code will then expose it.

// Once we extract `parseFaostatResponse` from the production code, this
// test imports it directly:
import { parseFaostatResponse } from "@/scripts/scrape-food-sources";

const FIXTURE = {
  data: [
    {
      "Domain Code": "GE",
      Area: "India",
      "Area Code": 100,
      Element: "Emissions intensity",
      Item: "Milk, whole fresh cow",
      Year: 2022,
      Unit: "kg CO2eq/kg product",
      Value: 2.71,
    },
    {
      "Domain Code": "GE",
      Area: "India",
      Element: "Emissions intensity",
      Item: "Meat of cattle with the bone, fresh or chilled",
      Year: 2022,
      Unit: "kg CO2eq/kg product",
      Value: 24.85,
    },
    {
      // Should be skipped: non-numeric value
      Area: "India",
      Item: "Some commodity",
      Value: null,
      Unit: "kg CO2eq/kg product",
      Year: 2022,
    },
  ],
};

describe("parseFaostatResponse", () => {
  it("returns one staging row per valid numeric value", () => {
    const rows = parseFaostatResponse(FIXTURE);
    expect(rows).toHaveLength(2);
  });

  it("flags every row as Indian and high quality", () => {
    const rows = parseFaostatResponse(FIXTURE);
    expect(rows.every((r) => r.is_indian === true)).toBe(true);
    expect(rows.every((r) => r.data_quality === "high")).toBe(true);
  });

  it("uses FAOSTAT as data_source label", () => {
    const rows = parseFaostatResponse(FIXTURE);
    expect(rows[0].data_source).toContain("FAOSTAT");
  });

  it("skips rows with non-numeric Value", () => {
    const rows = parseFaostatResponse(FIXTURE);
    expect(rows.find((r) => r.raw_name === "Some commodity")).toBeUndefined();
  });

  it("handles empty data array", () => {
    expect(parseFaostatResponse({ data: [] })).toEqual([]);
  });

  it("handles missing data key gracefully", () => {
    expect(parseFaostatResponse({} as unknown as { data: unknown[] })).toEqual([]);
  });
});
```

- [ ] **Step 2.3: Run test — confirm it fails (function not exported)**

```bash
pnpm vitest run __tests__/scrape-sources.test.ts 2>&1 | tail -10
```

Expected: FAIL — `parseFaostatResponse is not exported` or similar.

- [ ] **Step 2.4: Implement `parseFaostatResponse` and `fetchFaostatIndia` in `scripts/scrape-food-sources.ts`**

After the existing `fetchOwidPoore()` function (around line 91), append:

```ts
// ----- FAOSTAT — Emissions intensities (India) -----

const FAOSTAT_INDIA_GE =
  "https://faostatservices.fao.org/api/v1/en/data/GE" +
  "?area=100&year=2022&output_type=objects";

interface FaostatRecord {
  Area?: string;
  Item?: string;
  Element?: string;
  Year?: number;
  Unit?: string;
  Value?: number | string | null;
  "Item Code (CPC)"?: string;
}

interface FaostatResponse {
  data?: FaostatRecord[];
}

/**
 * Map a FAOSTAT "Emissions intensities" API response into staging rows.
 * Exported for testing.
 */
export function parseFaostatResponse(json: FaostatResponse): StagingRow[] {
  if (!json || !Array.isArray(json.data)) return [];
  const rows: StagingRow[] = [];
  for (const r of json.data) {
    const name = (r.Item ?? "").trim();
    const valRaw = r.Value;
    if (!name) continue;
    const val =
      typeof valRaw === "number"
        ? valRaw
        : valRaw == null
          ? NaN
          : Number(valRaw);
    if (!Number.isFinite(val) || val <= 0) continue;
    rows.push({
      raw_name: name,
      canonical_name: canonicalize(name),
      category: null,
      subcategory: null,
      kgco2e_per_kg: val,
      std_dev: null,
      lca_boundary: "Cradle-to-farm-gate",
      geographic_scope: "India",
      data_source: "FAOSTAT — Emissions intensities (FAO, 2022)",
      source_url:
        "https://www.fao.org/faostat/en/#data/GE",
      data_quality: "high",
      is_indian: true,
      raw_payload: {
        area: r.Area ?? "India",
        item: name,
        year: r.Year ?? 2022,
        unit: r.Unit ?? "kg CO2eq/kg product",
        value: val,
      },
    });
  }
  return rows;
}

async function fetchFaostatIndia(): Promise<StagingRow[]> {
  console.log(`→ Fetching FAOSTAT emissions intensities (India) …`);
  const res = await fetch(FAOSTAT_INDIA_GE);
  if (!res.ok) {
    console.warn(`! FAOSTAT fetch ${res.status} — skipping`);
    return [];
  }
  const json = (await res.json()) as FaostatResponse;
  const rows = parseFaostatResponse(json);
  console.log(`  + ${rows.length} rows`);
  return rows;
}
```

Then update `main()` (currently around lines 134-151) to call the new fetcher. Find this block:

```ts
async function main() {
  console.log("→ Scraping public food carbon sources into food_items_staging\n");

  const all: StagingRow[] = [];

  try {
    all.push(...(await fetchOwidPoore()));
  } catch (e) {
    console.warn("! OWID failed:", (e as Error).message);
  }

  // TODO: DEFRA, AGRIBALYSE, FAOSTAT, Open Food Facts adapters here.

  console.log(`\nTotal scraped: ${all.length}\nInserting …`);
  await insertInBatches(all);

  console.log("\n✓ Done. Next: pnpm db:reconcile");
}
```

Replace the `// TODO:` line with:

```ts
  try {
    all.push(...(await fetchFaostatIndia()));
  } catch (e) {
    console.warn("! FAOSTAT failed:", (e as Error).message);
  }

  // TODO (workstream C.2): DEFRA, AGRIBALYSE, Open Food Facts.
```

- [ ] **Step 2.5: Run the tests to confirm they pass**

```bash
pnpm vitest run __tests__/scrape-sources.test.ts
```

Expected: PASS — 6 tests.

- [ ] **Step 2.6: Run the full suite**

```bash
pnpm vitest run
```

Expected: PASS — 67 tests (61 + 6 new).

- [ ] **Step 2.7: Smoke-test the FAOSTAT adapter against the live API**

```bash
pnpm db:scrape 2>&1 | tail -10
```

Expected: log lines for both OWID and FAOSTAT, totals >0 for each. If FAOSTAT logs `0 rows`, inspect the actual JSON shape from step 2.1 — the parser may need a tweak for current field names.

---

## Task 3: Set up the curated CSV plumbing

**Files:**
- Create: `greenplate-website/data/curated_indian_supplemental.csv` (header only at this task)
- Modify: `scripts/seed-from-excel.ts` (add a sixth read step)
- Modify: `.gitignore` (add `data/.curated-skipped.txt`)

- [ ] **Step 3.1: Create the CSV header**

Create `greenplate-website/data/curated_indian_supplemental.csv` with the column header that the seeder's `rowFromUniformCsv` already understands. The columns expected (based on the comprehensive_indian_549.csv pattern the seeder reads) are:

```csv
name,category,subcategory,kgco2e_per_kg,std_dev,lca_boundary,geographic_scope,data_source,source_url,data_quality,is_indian
```

(Header only at this step — data rows are added in Task 4.)

- [ ] **Step 3.2: Read the seeder's `rowFromUniformCsv` to confirm column names**

```bash
grep -nA 20 "function rowFromUniformCsv" scripts/seed-from-excel.ts | head -30
```

Look at the column names the function expects. **If the column names differ from the header above** (e.g. it expects `Item` instead of `name`, or `kg_co2e_per_kg` with underscores), update the CSV header in step 3.1 to match exactly. The seeder is the authority; don't change it for the new CSV.

- [ ] **Step 3.3: Add a read step in the seeder**

In `scripts/seed-from-excel.ts`, find the block that ends after the fifth file's read (the Ultimate_Luxury_Restaurant one). After its insertion, before the `console.log("Total staging rows queued...")`, add a sixth read. Example (adjust to match actual file structure):

```ts
// 6. Curated supplemental Indian foods (committed to the repo's data/ folder)
const repoDataDir = path.join(__dirname, "..", "data");
const curatedPath = path.join(repoDataDir, "curated_indian_supplemental.csv");
if (fs.existsSync(curatedPath)) {
  console.log("Reading curated_indian_supplemental.csv …");
  const csvCurated = readCsv(curatedPath);
  for (const r of csvCurated) {
    const row = rowFromUniformCsv(r, "curated_indian_supplemental");
    if (row) stagingRows.push(row);
  }
  console.log(`  + ${csvCurated.length} raw rows`);
}
```

The exact variable names (`stagingRows`) and helper signatures must match what's already in the file; read context around line 213 first to confirm. **If `__dirname` isn't available** (ESM modules), use `import.meta.url` instead:

```ts
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
```

Check if the file already does this near the top before adding it.

- [ ] **Step 3.4: Add `.curated-skipped.txt` to .gitignore**

Append to `greenplate-website/.gitignore`:

```
# Curation work-log (per-row skipped during web verification)
data/.curated-skipped.txt
```

- [ ] **Step 3.5: Smoke-test the seeder with an empty curated CSV**

```bash
pnpm db:seed 2>&1 | tail -10
```

Expected: log line for `curated_indian_supplemental.csv` showing `+ 0 raw rows`. Total staging rows unchanged from prior run (3,479 from local files; plus any from the curated header — which contributes 0 since no data rows yet).

If the new read step fails (file not found, parse error), inspect and fix before moving to Task 4.

---

## Task 4: Curate the supplemental CSV

**Files:**
- Modify: `data/curated_indian_supplemental.csv` (add ~50–100 verified rows)
- Modify: `data/.curated-skipped.txt` (log unverifiable candidates)

This is the largest task by wall-clock time (~15–20 minutes of WebSearch / WebFetch). Each candidate item follows the same procedure.

- [ ] **Step 4.1: Lock the candidate list**

Use exactly this list of candidates. Categories with rough expected ranges (for sanity-checking returned values):

```text
# Regional breads (expected 0.3 – 1.5 kg CO2e/kg)
- paratha (plain)
- paratha (aloo)
- naan
- roomali roti
- bhakri
- thepla
- kulcha
- puri / poori
- bhature

# Indian sweets (expected 1.5 – 6.0 kg CO2e/kg)
- jalebi
- gulab jamun
- rasgulla
- besan ladoo
- coconut ladoo
- mysore pak
- soan papdi
- kaju katli
- rasmalai
- kheer

# Spice mixes & condiments (expected 1.0 – 5.0 kg CO2e/kg)
- garam masala
- chaat masala
- sambhar masala
- mango pickle (achaar)
- lemon pickle
- mint chutney
- coriander chutney
- tamarind chutney

# Packaged Indian snacks (expected 2.0 – 8.0 kg CO2e/kg)
- bhujia / sev
- namkeen
- banana chips
- murukku
- chakli
- chivda

# Indian beverages (expected per-kg or per-litre; expect 0.2 – 2.0)
- masala chai (per litre, milk + sugar + leaves)
- lassi (sweet)
- lassi (salted)
- tender coconut water
- kokum sherbet
- nimbu pani
- buttermilk (chaas)

# Indian dairy gaps (expected 1.0 – 7.0)
- paneer (Indian context)
- dahi / curd
- ghee
- khoa / mawa
- chhena
- shrikhand

# Indian oils (expected 3.0 – 9.0)
- mustard oil (kachi ghani)
- mustard oil (refined)
- groundnut oil
- coconut oil (cold-pressed)
- coconut oil (refined)
- sesame / til oil
- rice bran oil

# Common Indian pulses & lentils gaps (expected 0.5 – 2.5)
- toor dal / arhar dal
- chana dal
- urad dal
- moong dal
- masoor dal
- rajma (red kidney beans, Indian)
- chickpeas / chole
- horse gram / kulthi

# Indian staples gaps (expected 0.5 – 2.0)
- basmati rice (Indian-source)
- parboiled rice (Indian-source)
- jowar / sorghum
- bajra / pearl millet
- ragi / finger millet
- atta (whole-wheat flour)
- maida (refined wheat flour)
```

- [ ] **Step 4.2: Run the verify-and-add procedure once per candidate**

For each candidate name above, run this 3-step procedure:

```text
1. WebSearch: `"<name> LCA kgCO2e per kg India"` and `"<name> carbon footprint study India"` and `"<name> greenhouse gas emissions per kg"`.

2. For each of the top 2–3 hits returned:
   - WebFetch the URL.
   - Scan the page text for a numeric value with units "kg CO2e/kg", "kgCO2eq/kg", "kg CO2-eq/kg", or "gCO2e/kg" (divide by 1000).
   - Note: the value, the publishing source (paper title, report name, gov agency), and the URL.

3. Decision:
   a. If at least one source gives a numeric value AND that value is within the expected range for the candidate's category → ADD to `data/curated_indian_supplemental.csv` with that source as the citation. Use data_quality "high" if the source is a peer-reviewed paper (doi.org / sciencedirect.com / springer.com / mdpi.com), otherwise "medium".
   b. If two sources disagree by more than 2x → ADD with the median value, citing both in raw_payload, and use data_quality "medium".
   c. If no source gives a number, OR all numbers are wildly outside the expected range → APPEND to `data/.curated-skipped.txt` a line like `paratha (aloo): no citation found via WebSearch — skipped`. **Do not add the row.**
```

Use the canonicalize function for `canonical_name`:

```ts
// Quick local approximation if not running TypeScript: lowercase, replace
// non-alphanumeric with single space, trim. The reconciler will run the
// real canonicalize on insert so a hand-canonicalized name in the CSV is
// optional — leave it out (the seeder fills it).
```

Actually: the seeder's `rowFromUniformCsv` runs `canonicalize(raw_name)` itself, so the CSV does **not** need a `canonical_name` column. Skip it. The columns in the CSV should match what `rowFromUniformCsv` reads (confirmed in step 3.2).

- [ ] **Step 4.3: Quality gate on the resulting CSV**

```bash
echo "--- row count ---"
wc -l data/curated_indian_supplemental.csv
echo "--- citations look real? ---"
awk -F',' 'NR>1 {print $9}' data/curated_indian_supplemental.csv | sort -u | head -20
echo "--- all source_urls return HTTP 200? (sample 5) ---"
awk -F',' 'NR>1 {print $9}' data/curated_indian_supplemental.csv | sort -uR | head -5 | xargs -I{} curl -sI -o /dev/null -w "%{http_code} {}\n" {}
```

Expected:
- Row count: 51+ (50 verified items + 1 header line)
- Citations: real-looking DOIs / paper / report URLs, no `example.com` / `localhost` / `chatgpt.com`
- Sample HTTP checks: all 200 or 301/302 (redirects). If you see any 404, remove that row.

- [ ] **Step 4.4: Read back the skipped log**

```bash
wc -l data/.curated-skipped.txt 2>/dev/null || echo "(no skipped)"
head -20 data/.curated-skipped.txt
```

Record the count for the spec amendment in step 5.5.

---

## Task 5: Full pipeline run + verification

**Files:** none (just runs the pipeline)

- [ ] **Step 5.1: Run seed**

```bash
pnpm db:seed 2>&1 | tail -15
```

Expected: log lines for all six CSV/XLSX files, including `curated_indian_supplemental.csv: + NN raw rows` where NN ≥ 50.

- [ ] **Step 5.2: Run scrape**

```bash
pnpm db:scrape 2>&1 | tail -10
```

Expected: log lines for OWID (≥ 30 rows) and FAOSTAT (≥ 20 rows). Total scraped ≥ 50.

- [ ] **Step 5.3: Run reconcile**

```bash
pnpm db:reconcile 2>&1 | tail -10
```

Expected: final line `✓ Done. NNNN unique food_items · MMMM Indian · KKK high-quality`. **NNNN must be ≥ 1,200** (stretch ≥ 1,400).

- [ ] **Step 5.4: Spot-check via Supabase Management API**

```bash
cat > /tmp/spot-check.sql <<'EOF'
-- counts
select 'total', count(*)::text from public.food_items
union all
select 'indian', count(*)::text from public.food_items where is_indian = true
union all
select 'new_sources_count', count(*)::text from public.food_items
  where data_source like 'FAOSTAT%'
     or data_source like 'OWID%'
     or data_source = 'curated_indian_supplemental';

-- sample 5 new rows with their citations
select data_source, display_name, kgco2e_per_kg, source_url
from public.food_items
where data_source in (
  'FAOSTAT — Emissions intensities (FAO, 2022)',
  'OWID — Poore & Nemecek (Science 2018)',
  'curated_indian_supplemental'
)
order by random()
limit 5;

-- regression: confirm core Indian primaries weren't overwritten
select canonical_name, data_source, kgco2e_per_kg, is_indian
from public.food_items
where canonical_name in ('rice', 'wheat', 'paneer', 'dal lentil', 'chicken')
order by canonical_name;
EOF

curl -s -X POST \
  "https://api.supabase.com/v1/projects/qbslqlmmslaetylafxup/database/query" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(jq -Rs '{query: .}' < /tmp/spot-check.sql)" | python3 -m json.tool | head -80
```

(Where `${SUPABASE_ACCESS_TOKEN}` is the user's `sbp_…` access token — taken from the running session's env, not hard-coded in the plan.)

Expected:
- total ≥ 1200
- new_sources_count > 0
- 5 sample rows all have non-null source_urls; spot-check 2 of them with `curl -I "<url>"` → 200/301/302
- Core Indian primaries (rice, wheat, paneer, dal, chicken) are still flagged `is_indian: true` and not overwritten by FAOSTAT/OWID.

- [ ] **Step 5.5: Amend the spec with final numbers**

Open `docs/superpowers/specs/2026-05-21-food-data-expansion-design.md` and at the bottom append a "Final outcome" section:

```markdown
## Final outcome (filled after implementation)

- OWID URL resolved to: `<paste the URL that worked>`
- OWID rows inserted: `<N>`
- FAOSTAT rows inserted: `<N>`
- Curated CSV rows added: `<N>`
- Curated candidates skipped: `<N>` (see `data/.curated-skipped.txt`)
- **Final `food_items` count: `<N>`** (up from 1,082)
- Indian-flagged rows: `<N>`
- High-quality rows: `<N>`
```

- [ ] **Step 5.6: Run the full test suite one last time**

```bash
pnpm vitest run
```

Expected: 67 tests pass (61 prior + 6 FAOSTAT). Build is not strictly needed here (no app-code change) but run it for completeness:

```bash
pnpm build 2>&1 | tail -5
```

Expected: build completes cleanly.

---

## Task 6: Commit and push

**Files:** all changed.

- [ ] **Step 6.1: Stage everything**

```bash
git add scripts/scrape-food-sources.ts \
        scripts/seed-from-excel.ts \
        __tests__/scrape-sources.test.ts \
        data/curated_indian_supplemental.csv \
        .gitignore \
        docs/superpowers/specs/2026-05-21-food-data-expansion-design.md \
        docs/superpowers/plans/2026-05-21-food-data-expansion-plan.md

git diff --cached --stat
```

Expected: ~7 files changed. No surprise additions.

- [ ] **Step 6.2: Scan staged files for tokens before committing**

GitHub push protection will reject any `ghp_*` / `nfp_*` / `sbp_*` token. Scan defensively:

```bash
git diff --cached | grep -nE "ghp_[A-Za-z0-9]{30,}|nfp_[A-Za-z0-9]{30,}|sbp_[a-f0-9]{30,}|sb_secret_|sb_publishable_" && echo "STOP: secret in staged diff" || echo "OK: clean"
```

If `STOP:` appears, redact before committing.

- [ ] **Step 6.3: Commit**

```bash
git commit -m "$(cat <<'EOF'
Workstream C: expand food database with India-grounded sources

Three new inputs flow through the existing seed → scrape → reconcile
pipeline:

1. OWID — Poore & Nemecek (Science 2018): URL repaired (the prior
   owid-datasets repo path 404'd). ~43 high-quality global reference
   values restored.

2. FAOSTAT — Emissions intensities (FAO, 2022), filtered to area=India.
   ~50–80 India-specific commodity values (dairy, livestock, cereals)
   that reflect Indian agriculture characteristics, not European or
   global averages. Adapter is unit-tested via parseFaostatResponse
   on a mock fixture (6 tests).

3. data/curated_indian_supplemental.csv — hand-verified Indian-specialty
   foods (regional breads, sweets, snacks, oils, dairy gaps, pulses,
   millets). Each row cites a primary published source; values were
   confirmed via WebSearch + WebFetch against peer-reviewed papers
   and government / NGO reports. Unverifiable candidates were skipped
   and logged in data/.curated-skipped.txt (gitignored).

Result: food_items count goes from 1,082 → ≥ 1,200 (final number
in the spec's Final outcome section). Reconciler priority unchanged
— Indian-source rows still win where they exist; new global sources
appear in alt_sources jsonb for cross-reference on the methodology
page.

Files:
- scripts/scrape-food-sources.ts: fixed OWID URL; added fetchFaostatIndia
- scripts/seed-from-excel.ts: read curated_indian_supplemental.csv
- __tests__/scrape-sources.test.ts: 6 unit tests for FAOSTAT parser
- data/curated_indian_supplemental.csv: verified rows
- .gitignore: data/.curated-skipped.txt
- docs/.../food-data-expansion-design.md: amended with final counts
- docs/.../food-data-expansion-plan.md: new
EOF
)"
```

- [ ] **Step 6.4: Push**

```bash
git push "https://shubhraj5575:${GH_PAT}@github.com/shubhraj5575/greenplate-website.git" main
```

(`${GH_PAT}` substituted at runtime from the session's known PAT — not literal in the plan.)

Expected: push succeeds. If GitHub push protection rejects, loop back to step 6.2.

- [ ] **Step 6.5: Mark workstream C done**

```text
TaskUpdate({ taskId: "12", status: "completed" })
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Covered by |
|---|---|
| Fix OWID URL | Task 1 (entire) |
| Add `fetchFaostatIndia()` | Task 2 (entire) |
| Curated CSV with mandatory citations | Task 4 (procedure 4.2 + quality gate 4.3) |
| Seeder picks up new CSV | Task 3.3 |
| ≥ 1,200 final count (stretch ≥ 1,400) | Task 5.3 + 5.4 (gate) |
| 5 random spot-checks with HTTP 200 source_urls | Task 5.4 (sample query + curl) |
| Regression check on rice/wheat/paneer/dal/chicken | Task 5.4 (last query block) |
| All tests pass | Task 5.6 |
| Source code resilience (try/catch per adapter) | Task 2.4 (FAOSTAT in main()'s try/catch); OWID already had one |
| Don't change reconciler / schema | Confirmed in file structure table |
| Don't add AGRIBALYSE / OFF / ICAR | Out of scope — TODO comment updated in 2.4 |

**Placeholder scan:** No "TBD" / "TODO" / "fill in" left in steps. Step 1.4 is conditional and explicit. Step 3.2 / 3.3 reference reading the existing file to confirm helper signatures — that's a "look, then code accurately" instruction, not a placeholder.

**Type consistency:**
- `parseFaostatResponse(json: FaostatResponse): StagingRow[]` — matches the test import signature in 2.2 and the production code in 2.4
- `fetchFaostatIndia(): Promise<StagingRow[]>` — matches the existing `fetchOwidPoore()` signature
- CSV column names — referenced from step 3.2 (the seeder's existing `rowFromUniformCsv`), not freshly invented

**Risk recheck:** Task 4 (curation) is where the most can go wrong (network, hallucination). The verify-and-add procedure (4.2) makes hallucination structurally hard — if no source returns a number, no row is added. The "skip and log" path is preferred to fabricated data.
