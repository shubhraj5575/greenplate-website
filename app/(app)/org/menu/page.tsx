import { createClient } from "@/lib/supabase/server";
import { formatKg } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Menu" };

export default async function OrgMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ calc?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Load the specified or latest org calculation
  const query = sp.calc
    ? supabase.from("calculations").select("id, calc_type, inputs, total_kgco2e, created_at, name").eq("id", sp.calc).eq("user_id", user.id).maybeSingle()
    : supabase.from("calculations").select("id, calc_type, inputs, total_kgco2e, created_at, name").eq("user_id", user.id).in("calc_type", ["org_monthly", "org_annual"]).order("created_at", { ascending: false }).limit(1).maybeSingle();

  const { data: calc } = await query;

  // Extract menu items from inputs.scope3.menu_items
  const menuItems: Array<{ name: string; kgco2e_per_serving: number; monthly_servings: number }> =
    (calc?.inputs as any)?.scope3?.menu_items ?? [];

  const itemsWithCarbon = menuItems.map(item => ({
    ...item,
    annualKg: item.kgco2e_per_serving * item.monthly_servings * 12,
  })).sort((a, b) => b.annualKg - a.annualKg);

  const totalMenuKg = itemsWithCarbon.reduce((acc, i) => acc + i.annualKg, 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Link href={sp.calc ? `/dashboard?calc=${sp.calc}` : "/dashboard"} className="text-ink-400 hover:text-forest-700 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-sm font-medium tracking-widest text-forest-700 uppercase">Menu analysis</p>
          <h1 className="font-display text-3xl text-forest-900">
            {calc?.name || "Menu items"}
          </h1>
        </div>
      </div>

      {!calc || itemsWithCarbon.length === 0 ? (
        <div className="rounded-card border border-forest-700/10 bg-bone-100 p-8 text-center">
          <p className="text-ink-500">No menu items in this calculation.</p>
          <Link href="/org/calculate" className="mt-4 inline-flex items-center gap-2 rounded-full bg-forest-700 px-5 py-2.5 text-sm font-medium text-cream-50 transition hover:bg-forest-900">
            Run a calculation
          </Link>
        </div>
      ) : (
        <>
          {sp.calc && (
            <div className="mb-6 rounded-card border border-amber-500/30 bg-amber-500/8 px-5 py-3 text-sm text-ink-700">
              Snapshot from {new Date(calc.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}.
              <Link href="/org/menu" className="ml-2 text-forest-700 underline hover:text-forest-900">Back to latest</Link>
            </div>
          )}
          <ul className="space-y-2">
            {itemsWithCarbon.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-4 rounded-card border border-forest-700/10 bg-cream-50 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-700/8 font-display text-sm text-forest-700">{i + 1}</span>
                  <span className="font-medium text-ink-900">{item.name}</span>
                </div>
                <span className="tabular text-ink-700">{formatKg(item.annualKg)} / yr</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between rounded-card border border-forest-700/20 bg-bone-100 px-5 py-4 font-medium">
            <span className="text-ink-700">Total menu carbon</span>
            <span className="tabular font-display text-xl text-forest-900">{formatKg(totalMenuKg)} / yr</span>
          </div>
        </>
      )}
    </main>
  );
}
