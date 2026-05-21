/**
 * Ingest every local food data file into `food_items_staging`.
 *
 * Source files (in /Users/shubhraj/Downloads/greenplate-main/data):
 *   1. comprehensive_indian_food_carbon_database_549_items.csv
 *   2. verified_indian_food_carbon_database_17_items.csv
 *   3. indian_food_carbon_footprint_database.csv  (79 rows)
 *   4. Indian_Food_LCA_Database.xlsx  (964 rows)
 *   5. Ultimate_Luxury_Restaurant_Database_1200plus.csv.xlsx  (1066 rows)
 *
 * Reconciliation to `food_items` happens in `reconcile-food-db.ts`.
 * The luxury restaurant file also feeds `reference_menu_items` for autocomplete.
 *
 * Idempotent: truncates staging first, then inserts.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { admin } from "./lib/admin-client.js";
import { canonicalize, mapDataQuality, isIndian } from "./lib/canonical.js";

const DATA_DIR = "/Users/shubhraj/Downloads/greenplate-main/data";
// Repo-local data directory: greenplate-website/data/ (sibling of scripts/).
// Used for files versioned with the codebase (e.g. curated supplemental CSVs).
const REPO_DATA_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "data",
);

interface StagingRow {
  raw_name: string;
  canonical_name: string;
  category: string | null;
  subcategory: string | null;
  kgco2e_per_kg: number | null;
  std_dev: number | null;
  lca_boundary: string | null;
  geographic_scope: string | null;
  data_source: string;
  source_url: string | null;
  data_quality: "high" | "medium" | "low";
  is_indian: boolean;
  raw_payload: Record<string, unknown>;
}

interface MenuRefRow {
  name: string;
  category: string | null;
  city: string | null;
  region: string | null;
  state: string | null;
  price_range_inr: string | null;
  carbon_kg_per_kg: number | null;
  usage: string | null;
  source: string | null;
}

function readCsv<T = Record<string, unknown>>(file: string): T[] {
  const text = fs.readFileSync(file, "utf8");
  const parsed = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  if (parsed.errors.length) {
    console.warn(`! ${path.basename(file)} parse errors:`, parsed.errors.slice(0, 3));
  }
  return parsed.data;
}

function readXlsx<T = Record<string, unknown>>(
  file: string,
  sheetIndex = 0,
): T[] {
  const wb = XLSX.readFile(file);
  const ws = wb.Sheets[wb.SheetNames[sheetIndex]];
  return XLSX.utils.sheet_to_json<T>(ws, { defval: null });
}

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function rowFromUniformCsv(
  r: Record<string, unknown>,
  sourceLabel: string,
): StagingRow | null {
  const name = String(r.Food_Item ?? "").trim();
  const kg = parseNum(r.CO2_eq_per_kg);
  if (!name || kg === null) return null;
  return {
    raw_name: name,
    canonical_name: canonicalize(name),
    category: (r.Category as string) ?? null,
    subcategory: null,
    kgco2e_per_kg: kg,
    std_dev: parseNum(r.Standard_Deviation),
    lca_boundary: (r.LCA_Boundary as string) ?? null,
    geographic_scope: (r.Geographic_Scope as string) ?? null,
    data_source: `${sourceLabel} — ${String(r.Data_Source ?? "").trim() || "unknown"}`,
    source_url: String(r.Source_URL ?? "").trim() || null,
    data_quality: mapDataQuality(r.Data_Quality as string),
    is_indian: isIndian(r.Geographic_Scope as string),
    raw_payload: r,
  };
}

function rowFromIndianLcaXlsx(r: Record<string, unknown>): StagingRow | null {
  const name = String(r.Product_Name ?? "").trim();
  const kg = parseNum(r.Carbon_Footprint_kg_CO2e_per_kg);
  if (!name || kg === null) return null;
  return {
    raw_name: name,
    canonical_name: canonicalize(name),
    category: (r.Category as string) ?? null,
    subcategory: null,
    kgco2e_per_kg: kg,
    std_dev: null,
    lca_boundary: null,
    geographic_scope: (r.Region as string) ?? null,
    data_source: `Indian Food LCA Database — ${String(r.Source ?? "").trim() || "unknown"}`,
    source_url: r.DOI ? `https://doi.org/${String(r.DOI).trim()}` : null,
    data_quality: mapDataQuality(r.Data_Quality as string),
    is_indian: isIndian(r.Region as string),
    raw_payload: r,
  };
}

function rowsFromLuxuryRestaurantXlsx(file: string): {
  staging: StagingRow[];
  menu: MenuRefRow[];
} {
  const wb = XLSX.readFile(file);
  const staging: StagingRow[] = [];
  const menu: MenuRefRow[] = [];
  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sn], {
      defval: null,
    });
    for (const r of rows) {
      const name = String(r.Product_Name ?? "").trim();
      if (!name) continue;
      const kg = parseNum(r.Carbon_Footprint_kg_CO2e_per_kg);
      // food_items_staging entry (only if we have a kg)
      if (kg !== null) {
        staging.push({
          raw_name: name,
          canonical_name: canonicalize(name),
          category: (r.Category as string) ?? null,
          subcategory: null,
          kgco2e_per_kg: kg,
          std_dev: null,
          lca_boundary: null,
          geographic_scope: (r.Region as string) ?? (r.City as string) ?? null,
          data_source: `Ultimate Luxury Restaurant DB — ${String(r.Source ?? "").trim() || "unknown"}`,
          source_url: null,
          data_quality: mapDataQuality(r.Data_Quality as string),
          is_indian: isIndian((r.Region as string) ?? "India"),
          raw_payload: r,
        });
      }
      // reference_menu_items entry (always — even without carbon)
      menu.push({
        name,
        category: (r.Category as string) ?? null,
        city: (r.City as string) ?? null,
        region: (r.Region as string) ?? null,
        state: (r.State as string) ?? null,
        price_range_inr: (r.Price_Range_INR_per_kg as string) ?? null,
        carbon_kg_per_kg: kg,
        usage: (r.Usage as string) ?? null,
        source: (r.Source as string) ?? null,
      });
    }
  }
  return { staging, menu };
}

async function insertInBatches<T extends object>(
  table: string,
  rows: T[],
  size = 500,
) {
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error } = await admin.from(table).insert(chunk);
    if (error) {
      console.error(`! insert ${table} batch ${i / size}:`, error.message);
      throw error;
    }
    process.stdout.write(
      `\r  ${table}: ${Math.min(i + size, rows.length)} / ${rows.length}`,
    );
  }
  process.stdout.write("\n");
}

async function main() {
  console.log("→ Seeding food_items_staging + reference_menu_items\n");

  console.log("Wiping food_items_staging + reference_menu_items …");
  await admin
    .from("food_items_staging")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  await admin
    .from("reference_menu_items")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  const allStaging: StagingRow[] = [];

  // 1. Comprehensive 549
  console.log("Reading comprehensive_indian_food_carbon_database_549_items.csv …");
  const csv1 = readCsv(path.join(DATA_DIR, "comprehensive_indian_food_carbon_database_549_items.csv"));
  for (const r of csv1) {
    const row = rowFromUniformCsv(r, "comprehensive_indian_549");
    if (row) allStaging.push(row);
  }
  console.log(`  + ${csv1.length} raw rows`);

  // 2. Verified 17
  console.log("Reading verified_indian_food_carbon_database_17_items.csv …");
  const csv2 = readCsv(path.join(DATA_DIR, "verified_indian_food_carbon_database_17_items.csv"));
  for (const r of csv2) {
    const row = rowFromUniformCsv(r, "verified_indian_17");
    if (row) {
      row.data_quality = "high"; // user explicitly curated
      allStaging.push(row);
    }
  }
  console.log(`  + ${csv2.length} raw rows`);

  // 3. Indian 79
  console.log("Reading indian_food_carbon_footprint_database.csv …");
  const csv3 = readCsv(path.join(DATA_DIR, "indian_food_carbon_footprint_database.csv"));
  for (const r of csv3) {
    const row = rowFromUniformCsv(r, "indian_79");
    if (row) allStaging.push(row);
  }
  console.log(`  + ${csv3.length} raw rows`);

  // 4. Indian LCA xlsx 964
  console.log("Reading Indian_Food_LCA_Database.xlsx …");
  const xlsx1 = readXlsx(path.join(DATA_DIR, "Indian_Food_LCA_Database.xlsx"));
  for (const r of xlsx1) {
    const row = rowFromIndianLcaXlsx(r);
    if (row) allStaging.push(row);
  }
  console.log(`  + ${xlsx1.length} raw rows`);

  // 5. Luxury restaurant 1066 (both sheets) — fills staging AND reference_menu_items
  console.log("Reading Ultimate_Luxury_Restaurant_Database_1200plus.csv.xlsx …");
  const { staging: luxStaging, menu: luxMenu } = rowsFromLuxuryRestaurantXlsx(
    path.join(DATA_DIR, "Ultimate_Luxury_Restaurant_Database_1200plus.csv.xlsx"),
  );
  allStaging.push(...luxStaging);
  console.log(`  + ${luxStaging.length} staging rows · ${luxMenu.length} menu refs`);

  // 6. Curated supplemental Indian foods — repo-local, hand-verified rows
  //    with primary citations in Source_URL. Optional: if the file is
  //    absent or has only a header, this contributes 0 rows.
  const curatedPath = path.join(REPO_DATA_DIR, "curated_indian_supplemental.csv");
  if (fs.existsSync(curatedPath)) {
    console.log("Reading curated_indian_supplemental.csv …");
    const csvCurated = readCsv(curatedPath);
    let added = 0;
    for (const r of csvCurated) {
      const row = rowFromUniformCsv(r, "curated_indian_supplemental");
      if (row) {
        allStaging.push(row);
        added++;
      }
    }
    console.log(`  + ${csvCurated.length} raw rows (${added} accepted)`);
  } else {
    console.log("(no curated_indian_supplemental.csv — skipping)");
  }

  console.log(`\nTotal staging rows queued: ${allStaging.length}\n`);

  console.log("Inserting food_items_staging …");
  await insertInBatches("food_items_staging", allStaging);

  console.log("Inserting reference_menu_items …");
  await insertInBatches("reference_menu_items", luxMenu);

  console.log("\n✓ Done. Next: pnpm db:scrape  → then  pnpm db:reconcile");
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
