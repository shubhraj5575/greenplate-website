import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { HistoryRow } from "@/components/app/HistoryRow";

export const metadata = { title: "History" };

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("calculations")
    .select("id, calc_type, total_kgco2e, created_at, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const hasRows = rows && rows.length > 0;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-widest text-forest-700 uppercase">
            Calculation log
          </p>
          <h1 className="mt-2 font-display text-4xl text-forest-900">History</h1>
        </div>
        {hasRows && (
          <Link
            href="/calculate"
            className="inline-flex items-center gap-1.5 rounded-full border border-forest-700/20 px-4 py-2 text-sm text-forest-900 transition hover:border-forest-700/50"
          >
            New run <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {!hasRows ? (
        <EmptyHistory />
      ) : (
        <>
          <p className="mt-3 text-sm text-ink-500">
            Every calculation you&apos;ve saved.{" "}
            <span className="text-ink-400">
              Diff between consecutive runs coming in a future build.
            </span>
          </p>
          <ul className="mt-8 space-y-3">
            {rows.map((r, i) => (
              <HistoryRow key={r.id} row={r} index={i} total={rows.length} />
            ))}
          </ul>
          <p className="mt-6 text-xs text-ink-400">
            Showing {rows.length} calculation{rows.length !== 1 ? "s" : ""}.
          </p>
        </>
      )}
    </main>
  );
}

function EmptyHistory() {
  return (
    <div className="mt-20 flex flex-col items-center gap-5 text-center">
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-700/8">
        <svg
          viewBox="0 0 40 40"
          className="h-8 w-8 text-forest-700"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="6"
            y="8"
            width="28"
            height="26"
            rx="4"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M13 8V5M27 8V5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M6 16h28"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M13 24h5M13 29h10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="28" cy="27" r="4" fill="currentColor" opacity="0.25" />
          <path
            d="M26 27l1.5 1.5L30 25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div>
        <p className="font-display text-xl text-forest-900">
          Nothing logged yet
        </p>
        <p className="mt-2 max-w-sm text-sm text-ink-500">
          Each time you run the calculator your result is saved here — so you
          can track how your footprint changes over time.
        </p>
      </div>

      <Link
        href="/calculate"
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-forest-700 px-6 py-3 text-sm font-medium text-cream-50 transition hover:bg-forest-900"
      >
        Run your first calculation
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
