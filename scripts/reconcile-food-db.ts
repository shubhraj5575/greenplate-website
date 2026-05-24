/**
 * Reduce `food_items_staging` → `food_items`.
 *
 * Groups by (canonical_name, geographic_scope) so regional variants of the same
 * food (e.g. Tomato-Haryana vs Tomato-Delhi) become separate production rows
 * rather than being collapsed. Within each group, the highest-priority source
 * becomes the primary row and the rest go into alt_sources.
 *
 * Priority order for choosing the primary:
 *   1. data_quality "high"
 *   2. is_indian = true
 *   3. more recent year (if available in raw_payload)
 *   4. tighter std_dev
 *
 * Idempotent: truncates food_items first, then re-inserts from staging.
 */

import { admin } from "./lib/admin-client.js";

interface StagingRow {
  id: string;
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

const QUALITY_ORDER = { high: 3, medium: 2, low: 1 } as const;

function priority(r: StagingRow): number {
  let p = QUALITY_ORDER[r.data_quality] * 100;
  if (r.is_indian) p += 30;
  const year = Number((r.raw_payload as { year?: number })?.year ?? 0);
  if (year >= 2020) p += 10;
  if (r.std_dev !== null && r.std_dev < 1) p += 5;
  return p;
}

async function fetchAllStaging(): Promise<StagingRow[]> {
  const all: StagingRow[] = [];
  let from = 0;
  const page = 1000;
  while (true) {
    const { data, error } = await admin
      .from("food_items_staging")
      .select(
        "id,raw_name,canonical_name,category,subcategory,kgco2e_per_kg,std_dev,lca_boundary,geographic_scope,data_source,source_url,data_quality,is_indian,raw_payload",
      )
      .order("id", { ascending: true })
      .range(from, from + page - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as StagingRow[]));
    if (data.length < page) break;
    from += page;
  }
  return all;
}

async function main() {
  console.log("→ Reconciling food_items_staging → food_items\n");

  console.log("Reading staging …");
  const staging = await fetchAllStaging();
  console.log(`  ${staging.length} staging rows total`);

  const groups = new Map<string, StagingRow[]>();
  for (const r of staging) {
    if (!r.canonical_name) continue;
    const key = `${r.canonical_name}||${r.geographic_scope ?? ""}`;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }
  console.log(`  ${groups.size} unique (canonical_name, geographic_scope) pairs`);

  console.log("Wiping food_items …");
  await admin
    .from("food_items")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  const primaries: {
    canonical_name: string;
    display_name: string;
    category: string;
    subcategory: string | null;
    kgco2e_per_kg: number;
    std_dev: number | null;
    lca_boundary: string | null;
    geographic_scope: string | null;
    data_source: string;
    source_url: string | null;
    data_quality: "high" | "medium" | "low";
    is_indian: boolean;
    alt_sources: Array<{
      data_source: string;
      kgco2e_per_kg: number;
      data_quality: string;
      is_indian: boolean;
      source_url: string | null;
    }>;
  }[] = [];

  for (const [canonical, rows] of groups) {
    rows.sort((a, b) => priority(b) - priority(a));
    const primary = rows[0];
    const alt = rows.slice(1).map((r) => ({
      data_source: r.data_source,
      kgco2e_per_kg: r.kgco2e_per_kg,
      data_quality: r.data_quality,
      is_indian: r.is_indian,
      source_url: r.source_url,
    }));
    primaries.push({
      canonical_name: canonical,
      display_name: primary.raw_name,
      category: primary.category ?? "Uncategorized",
      subcategory: primary.subcategory,
      kgco2e_per_kg: primary.kgco2e_per_kg,
      std_dev: primary.std_dev,
      lca_boundary: primary.lca_boundary,
      geographic_scope: primary.geographic_scope,
      data_source: primary.data_source,
      source_url: primary.source_url,
      data_quality: primary.data_quality,
      is_indian: primary.is_indian,
      alt_sources: alt,
    });
  }

  console.log(`Inserting ${primaries.length} reconciled food_items …`);
  const size = 500;
  for (let i = 0; i < primaries.length; i += size) {
    const chunk = primaries.slice(i, i + size);
    const { error } = await admin.from("food_items").insert(chunk);
    if (error) {
      console.error("! insert error:", error.message);
      throw error;
    }
    process.stdout.write(
      `\r  food_items: ${Math.min(i + size, primaries.length)} / ${primaries.length}`,
    );
  }
  process.stdout.write("\n");

  // Brief stats
  const indianCount = primaries.filter((p) => p.is_indian).length;
  const highCount = primaries.filter((p) => p.data_quality === "high").length;
  console.log(
    `\n✓ Done. ${primaries.length} unique food_items · ${indianCount} Indian · ${highCount} high-quality`,
  );
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
