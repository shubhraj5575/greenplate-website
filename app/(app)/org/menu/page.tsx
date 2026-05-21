import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Menu carbon" };

export default async function OrgMenuPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-medium tracking-widest text-forest-700 uppercase">
        Menu carbon
      </p>
      <h1 className="mt-2 font-display text-4xl text-forest-900">
        Per-serving carbon, built from ingredients.
      </h1>
      <p className="mt-4 text-ink-500">
        The food-database-backed menu builder needs the food_items table seeded
        (Phase 1 scrapers). Once data is loaded, this page becomes a searchable
        autocomplete that lets you compose a dish, set serving size and monthly
        servings, and saves per-dish kg CO₂e back to your org.
      </p>

      <div className="mt-10 rounded-card border border-amber-500/30 bg-amber-500/5 p-8">
        <h2 className="font-display text-xl text-amber-600">In progress</h2>
        <p className="mt-3 text-sm text-ink-700">
          Run the seeders against your Supabase project to enable this view:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-card bg-cream-50 p-4 text-xs text-ink-700">
{`pnpm db:seed       # local Excel/CSV ingest
pnpm db:scrape     # OWID + DEFRA + ...
pnpm db:reconcile  # dedup to food_items`}
        </pre>
        <Link
          href="/org/calculate"
          className="mt-6 inline-block rounded-full bg-forest-700 px-5 py-2.5 text-sm font-medium text-cream-50 transition hover:bg-forest-900"
        >
          Use the inline calculator instead
        </Link>
      </div>
    </main>
  );
}
