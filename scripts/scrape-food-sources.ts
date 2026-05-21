/**
 * Pull authoritative public food-carbon datasets into `food_items_staging`.
 *
 * Re-runnable: each source uses a stable `data_source` label, so re-running
 * will produce duplicate canonical_name rows under the same source — these
 * are then deduped by reconcile-food-db.ts. To start clean, the seeder script
 * truncates staging first; this scraper appends.
 *
 * v2 implemented sources (public CSV, no scraping):
 *   - Our World in Data: "data-on-the-environmental-impacts-of-food"
 *     (the Poore & Nemecek Science 2018 dataset, OWID-mirrored)
 *
 * TODOs (v2.x): DEFRA UK GHG factors XLSX, AGRIBALYSE 3.1 CSV,
 *   FAOSTAT emissions-intensity, EPA SCGHG v1.3, Open Food Facts API.
 *   Each is a stable public dataset; add a function in sources/ when ready.
 */

import { admin } from "./lib/admin-client.js";
import { canonicalize, mapDataQuality } from "./lib/canonical.js";

interface StagingRow {
  raw_name: string;
  canonical_name: string;
  category: string | null;
  subcategory: string | null;
  kgco2e_per_kg: number;
  std_dev: number | null;
  lca_boundary: string | null;
  geographic_scope: string | null;
  data_source: string;
  source_url: string | null;
  data_quality: "high" | "medium" | "low";
  is_indian: boolean;
  raw_payload: Record<string, unknown>;
}

// ----- Our World in Data — Poore & Nemecek 2018 (food emissions) -----

const OWID_CSV =
  "https://raw.githubusercontent.com/owid/owid-datasets/master/datasets/" +
  "Environmental%20impacts%20of%20food%20-%20Poore%20%26%20Nemecek%20(2018)/" +
  "Environmental%20impacts%20of%20food%20-%20Poore%20%26%20Nemecek%20(2018).csv";

async function fetchOwidPoore(): Promise<StagingRow[]> {
  console.log(`→ Fetching OWID Poore & Nemecek …`);
  const res = await fetch(OWID_CSV);
  if (!res.ok) {
    console.warn(`! OWID fetch ${res.status} — skipping`);
    return [];
  }
  const text = await res.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]);
  const ghgCol = header.findIndex((h) =>
    /food emissions/i.test(h) || /ghg emissions per kg/i.test(h),
  );
  const foodCol = header.findIndex((h) => /^entity$/i.test(h) || /^food/i.test(h));
  if (ghgCol === -1 || foodCol === -1) {
    console.warn("! OWID columns not found:", header);
    return [];
  }

  const rows: StagingRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const name = cols[foodCol]?.trim();
    const kgStr = cols[ghgCol]?.trim();
    if (!name || !kgStr) continue;
    const kg = Number(kgStr);
    if (!Number.isFinite(kg)) continue;
    rows.push({
      raw_name: name,
      canonical_name: canonicalize(name),
      category: null,
      subcategory: null,
      kgco2e_per_kg: kg,
      std_dev: null,
      lca_boundary: "Cradle-to-retail",
      geographic_scope: "Global",
      data_source: "OWID — Poore & Nemecek (Science 2018)",
      source_url: "https://ourworldindata.org/environmental-impacts-of-food",
      data_quality: mapDataQuality("peer-reviewed"),
      is_indian: false,
      raw_payload: { entity: name, ghg_per_kg: kg },
    });
  }
  console.log(`  + ${rows.length} rows`);
  return rows;
}

// Minimal CSV line parser (handles quoted commas).
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuote) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuote = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuote = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

async function insertInBatches(rows: StagingRow[], size = 500) {
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error } = await admin.from("food_items_staging").insert(chunk);
    if (error) throw error;
    process.stdout.write(
      `\r  staging: ${Math.min(i + size, rows.length)} / ${rows.length}`,
    );
  }
  process.stdout.write("\n");
}

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

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
