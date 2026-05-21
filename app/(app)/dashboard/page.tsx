import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, full_name, household_size, city")
    .eq("id", user.id)
    .maybeSingle();

  const { data: calc } = await supabase
    .from("calculations")
    .select("id, calc_type, breakdown, total_kgco2e, created_at, inputs")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: history } = await supabase
    .from("calculations")
    .select("id, total_kgco2e, created_at, calc_type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium tracking-widest text-forest-700 uppercase">
            {profile?.full_name ? `Hello, ${profile.full_name.split(" ")[0]}` : "Welcome"}
          </p>
          <h1 className="mt-2 font-display text-4xl text-forest-900">
            Your footprint at a glance.
          </h1>
        </div>
        <Link
          href={
            profile?.account_type === "organization" ? "/org/calculate" : "/calculate"
          }
          className="rounded-full bg-forest-700 px-5 py-2.5 text-sm font-medium text-cream-50 transition hover:bg-forest-900"
        >
          {calc ? "Re-calculate" : "Start calculation"}
        </Link>
      </header>

      {!calc ? (
        <EmptyState
          isOrg={profile?.account_type === "organization"}
          name={profile?.full_name ?? null}
        />
      ) : (
        <DashboardSummary
          totalKg={Number(calc.total_kgco2e)}
          breakdown={
            calc.breakdown as Record<string, number> | null
          }
          householdSize={profile?.household_size ?? 1}
          history={history ?? []}
        />
      )}
    </main>
  );
}

function EmptyState({ isOrg, name }: { isOrg: boolean; name: string | null }) {
  void name;
  return (
    <div className="rounded-card border border-forest-700/10 bg-bone-100 p-10 text-center shadow-soft">
      <p className="font-display text-2xl text-forest-900">
        Nothing measured yet.
      </p>
      <p className="mt-3 text-ink-500">
        Run your first calculation — it takes under five minutes and gives you
        a number you can actually act on.
      </p>
      <Link
        href={isOrg ? "/org/calculate" : "/calculate"}
        className="mt-6 inline-block rounded-full bg-forest-700 px-6 py-3 text-sm font-medium text-cream-50 transition hover:bg-forest-900"
      >
        {isOrg ? "Start organization audit" : "Calculate my footprint"}
      </Link>
    </div>
  );
}
