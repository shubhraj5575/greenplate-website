import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { WelcomeToast } from "@/components/app/WelcomeToast";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ calc?: string; from?: string }>;
}) {
  const sp = await searchParams;
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

  // If ?calc=<id> is in the URL, load that specific calc (still RLS-scoped to user)
  const calcId = sp.calc;
  const calcQuery = calcId
    ? supabase.from("calculations").select("id, calc_type, breakdown, total_kgco2e, scope1_kgco2e, scope2_kgco2e, scope3_kgco2e, created_at, inputs, name").eq("id", calcId).eq("user_id", user.id).maybeSingle()
    : supabase.from("calculations").select("id, calc_type, breakdown, total_kgco2e, scope1_kgco2e, scope2_kgco2e, scope3_kgco2e, created_at, inputs, name").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();

  const { data: calc } = await calcQuery;

  const { data: history } = await supabase
    .from("calculations")
    .select("id, total_kgco2e, created_at, calc_type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      {/* Shows a "Footprint saved!" toast when redirected from the calculator */}
      <WelcomeToast />

      <header className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium tracking-widest text-forest-700 uppercase">
            {profile?.full_name
              ? `Hello, ${profile.full_name.split(" ")[0]}`
              : "Welcome"}
          </p>
          <h1 className="mt-2 font-display text-4xl text-forest-900">
            Your footprint at a glance.
          </h1>
        </div>
        <Link
          href={
            profile?.account_type === "organization"
              ? "/org/calculate"
              : "/calculate"
          }
          className="inline-flex items-center gap-2 rounded-full bg-forest-700 px-5 py-2.5 text-sm font-medium text-cream-50 transition hover:bg-forest-900"
        >
          {calc ? "Re-calculate" : "Start calculation"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {!calc ? (
        <EmptyState
          isOrg={profile?.account_type === "organization"}
          name={profile?.full_name ?? null}
        />
      ) : (
        <>
          {calcId && calc && (
            <div className="mb-6 flex items-center justify-between gap-4 rounded-card border border-amber-500/30 bg-amber-500/8 px-5 py-3 text-sm text-ink-700">
              <span>
                Viewing snapshot from {new Date(calc.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}.
                {calc.name && <span className="ml-1 font-medium">&ldquo;{calc.name}&rdquo;</span>}
              </span>
              <Link href="/dashboard" className="text-forest-700 underline underline-offset-4 hover:text-forest-900 shrink-0">
                Back to latest
              </Link>
            </div>
          )}
          <DashboardSummary
            totalKg={Number(calc.total_kgco2e)}
            breakdown={calc.breakdown as Record<string, number> | null}
            householdSize={profile?.household_size ?? 1}
            history={history ?? []}
            scope1Kg={calc.scope1_kgco2e ? Number(calc.scope1_kgco2e) : undefined}
            scope2Kg={calc.scope2_kgco2e ? Number(calc.scope2_kgco2e) : undefined}
            scope3Kg={calc.scope3_kgco2e ? Number(calc.scope3_kgco2e) : undefined}
            menuItems={
              (calc.inputs as any)?.scope3?.menu_items
                ? ((calc.inputs as any).scope3.menu_items as Array<{ name: string; kgco2e_per_serving: number; monthly_servings: number }>)
                    .map((m) => ({ name: m.name, annualKg: m.kgco2e_per_serving * m.monthly_servings * 12 }))
                    .sort((a, b) => b.annualKg - a.annualKg)
                : undefined
            }
          />
        </>
      )}
    </main>
  );
}

function EmptyState({ isOrg, name }: { isOrg: boolean; name: string | null }) {
  const firstName = name?.split(" ")[0] ?? null;
  return (
    <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:gap-14">
      {/* Icon bubble */}
      <div className="shrink-0">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-forest-700/8">
          <svg
            viewBox="0 0 48 48"
            className="h-10 w-10 text-forest-700"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M24 6C13 6 6 18 6 28c0 7.2 4.8 12 12 13.5C19.5 35 22 30 24 24c2 6 4.5 11 6 17.5C38 40 42 35.2 42 28c0-10-7-22-18-22Z"
              fill="currentColor"
              opacity={0.18}
            />
            <path
              d="M24 6C13 6 6 18 6 28c0 7.2 4.8 12 12 13.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M24 6c11 0 18 12 18 22 0 7.2-4.8 12-12 13.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M24 6v36"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="3 4"
            />
          </svg>
        </div>
      </div>

      {/* Copy + CTA */}
      <div className="min-w-0">
        <h2 className="font-display text-2xl text-forest-900">
          {firstName ? `Ready when you are, ${firstName}.` : "Ready when you are."}
        </h2>
        <p className="mt-3 max-w-md text-ink-500">
          Your first calculation takes under five minutes and gives you a number
          you can actually act on — not a vague pledge, a real figure.
        </p>

        <ul className="mt-6 space-y-2.5">
          {[
            "Annual kg CO₂e broken down by category",
            "How you compare to India's per-capita average",
            "Your top three contributors — what to tackle first",
            "Impact comparisons that make the number tangible",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-ink-600">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-700/10 text-[10px] font-bold text-forest-700"
              >
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        <Link
          href={isOrg ? "/org/calculate" : "/calculate"}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-forest-700 px-6 py-3 text-sm font-medium text-cream-50 transition hover:bg-forest-900"
        >
          {isOrg ? "Start organization audit" : "Calculate my footprint"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
