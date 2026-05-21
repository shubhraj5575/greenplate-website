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

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import Papa from "papaparse";
import { admin } from "./lib/admin-client.js";
import { canonicalize, mapDataQuality } from "./lib/canonical.js";

export interface StagingRow {
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

// Resolved 2026-05-21: the owid-datasets repo was archived; the live
// grapher CSV export below pulls the same Poore & Nemecek 2018 figures.
// Columns: Entity, Year, "Greenhouse gas emissions per kilogram".
const OWID_CSV =
  "https://ourworldindata.org/grapher/ghg-per-kg-poore.csv?v=1&csvType=full";

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
  const ghgCol = header.findIndex(
    (h) =>
      /food emissions/i.test(h) ||
      /ghg emissions per kg/i.test(h) ||
      /greenhouse gas.*per (kilogram|kg)/i.test(h),
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

// ----- FAOSTAT — Emissions intensities (India) -----
//
// FAOSTAT's REST API now requires auth, so this adapter downloads the
// public bulk ZIP, extracts the wide-format CSV via the system `unzip`,
// and pulls India rows (Area Code 100) with Element = "Emissions
// intensity". The CSV has 130+ columns (Y1961…Y2023 each with a flag
// column); we read the most-recent year that has a numeric value.

const FAOSTAT_ZIP_URL =
  "https://bulks-faostat.fao.org/production/Environment_Emissions_intensities_E_All_Data.zip";
const FAOSTAT_CSV_NAME =
  "Environment_Emissions_intensities_E_All_Data.csv";
const FAOSTAT_INDIA_AREA_CODE = "100";

/**
 * Parse the FAOSTAT Emissions-intensities bulk CSV and return staging
 * rows for India (Area Code 100, Element "Emissions intensity"), using
 * the most recent non-empty year's value.
 *
 * Exported for unit testing on canned fixtures.
 */
export function parseFaostatCsv(csvText: string): StagingRow[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  if (parsed.errors.length) {
    console.warn(
      "! FAOSTAT parse errors:",
      parsed.errors.slice(0, 3),
    );
  }
  const rows: StagingRow[] = [];
  // Pre-compute the list of year columns in descending order so we pick
  // the most recent non-empty value.
  const sampleRow = parsed.data[0] ?? {};
  const yearCols = Object.keys(sampleRow)
    .filter((k) => /^Y\d{4}$/.test(k))
    .sort()
    .reverse();
  for (const r of parsed.data) {
    if ((r["Area Code"] ?? "").trim() !== FAOSTAT_INDIA_AREA_CODE) continue;
    if ((r["Element"] ?? "").trim() !== "Emissions intensity") continue;
    const item = (r["Item"] ?? "").trim();
    if (!item) continue;
    let val = NaN;
    let year = 0;
    for (const yk of yearCols) {
      const raw = (r[yk] ?? "").trim();
      if (!raw) continue;
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) {
        val = n;
        year = Number(yk.slice(1));
        break;
      }
    }
    if (!Number.isFinite(val) || val <= 0) continue;
    rows.push({
      raw_name: item,
      canonical_name: canonicalize(item),
      category: null,
      subcategory: null,
      kgco2e_per_kg: val,
      std_dev: null,
      lca_boundary: "Cradle-to-farm-gate",
      geographic_scope: "India",
      data_source: `FAOSTAT — Emissions intensities (FAO, ${year})`,
      source_url: "https://www.fao.org/faostat/en/#data/GE",
      data_quality: "high",
      is_indian: true,
      raw_payload: {
        area: "India",
        area_code: 100,
        item,
        item_code: r["Item Code"] ?? null,
        year,
        unit: r["Unit"] ?? "kg CO2eq/kg",
        value: val,
      },
    });
  }
  return rows;
}

async function fetchFaostatIndia(): Promise<StagingRow[]> {
  console.log(`→ Fetching FAOSTAT emissions intensities (India) …`);
  const tmpZip = path.join(os.tmpdir(), "greenplate-faostat-ei.zip");
  let res: Response;
  try {
    res = await fetch(FAOSTAT_ZIP_URL);
  } catch (e) {
    console.warn(`! FAOSTAT network: ${(e as Error).message} — skipping`);
    return [];
  }
  if (!res.ok) {
    console.warn(`! FAOSTAT fetch ${res.status} — skipping`);
    return [];
  }
  fs.writeFileSync(tmpZip, Buffer.from(await res.arrayBuffer()));
  let csvText: string;
  try {
    const out = execFileSync("unzip", ["-p", tmpZip, FAOSTAT_CSV_NAME], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    csvText = out;
  } catch (e) {
    console.warn(
      `! FAOSTAT unzip failed: ${(e as Error).message} — skipping`,
    );
    return [];
  }
  const rows = parseFaostatCsv(csvText);
  console.log(`  + ${rows.length} rows`);
  return rows;
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

  try {
    all.push(...(await fetchFaostatIndia()));
  } catch (e) {
    console.warn("! FAOSTAT failed:", (e as Error).message);
  }

  // TODO (workstream C.2): DEFRA, AGRIBALYSE, Open Food Facts.

  console.log(`\nTotal scraped: ${all.length}\nInserting …`);
  await insertInBatches(all);

  console.log("\n✓ Done. Next: pnpm db:reconcile");
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
