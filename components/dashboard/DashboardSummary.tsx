"use client";

import { useMemo } from "react";
import { computeEquivalents, offsetCostINR } from "@/lib/equivalents";
import { comparisonVsIndia, INDIA_BENCHMARKS } from "@/lib/india-benchmarks";
import { formatKg, formatINR, formatNumber } from "@/lib/utils";
import { BreakdownDonut } from "./BreakdownDonut";
import { TrendArea } from "./TrendArea";

const PALETTE = [
  "#1f3a2e",
  "#2f5c46",
  "#3f6d52",
  "#6b8f77",
  "#9fbaa8",
  "#d97706",
  "#b45309",
  "#84a98c",
  "#475d54",
  "#8fa39a",
];

const CATEGORY_LABELS: Record<string, string> = {
  electricity: "Electricity",
  cooking_fuel: "Cooking fuel",
  water: "Water",
  road_transport: "Road",
  rail_transport: "Rail",
  air_transport: "Air",
  food: "Food",
  waste: "Waste",
  clothing: "Clothing",
  electronics: "Electronics",
  // org scopes — used if present
  scope1: "Scope 1",
  scope2: "Scope 2",
  scope3: "Scope 3",
};

interface HistoryRow {
  id: string;
  total_kgco2e: number | string;
  created_at: string;
  calc_type: string;
}

export function DashboardSummary({
  totalKg,
  breakdown,
  householdSize,
  history,
}: {
  totalKg: number;
  breakdown: Record<string, number> | null;
  householdSize: number;
  history: HistoryRow[];
}) {
  const equivalents = useMemo(() => computeEquivalents(totalKg), [totalKg]);
  const comparison = useMemo(() => comparisonVsIndia(totalKg), [totalKg]);
  const offset = useMemo(() => offsetCostINR(totalKg), [totalKg]);

  const slices = useMemo(() => {
    if (!breakdown) return [];
    return Object.entries(breakdown)
      .filter(([, v]) => Number(v) > 0)
      .map(([k, v], i) => ({
        name: CATEGORY_LABELS[k] ?? k,
        value: Number(v),
        color: PALETTE[i % PALETTE.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [breakdown]);

  const top3 = slices.slice(0, 3);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Hero KPI */}
      <div className="lg:col-span-2 rounded-card border border-forest-700/10 bg-bone-100 p-8 shadow-card">
        <p className="text-xs font-medium tracking-widest text-forest-700 uppercase">
          Annual footprint
        </p>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="font-display text-6xl tabular text-forest-900">
            {formatKg(totalKg)}
          </span>
          <span className="text-ink-500">CO₂e / year</span>
        </div>
        <p className="mt-3 text-sm text-ink-500">
          Per person:{" "}
          <span className="font-medium text-ink-700 tabular">
            {formatKg(totalKg / Math.max(1, householdSize))}
          </span>{" "}
          · {formatNumber(comparison.pctOfAvg, { maximumFractionDigits: 0 })}% of
          India per-capita average ({formatKg(INDIA_BENCHMARKS.individual_avg)}).
        </p>
        <ComparisonBar pct={Math.min(200, comparison.pctOfAvg)} />
      </div>

      {/* Donut */}
      <div className="rounded-card border border-forest-700/10 bg-bone-100 p-6 shadow-soft">
        <p className="text-xs font-medium tracking-widest text-forest-700 uppercase">
          By category
        </p>
        <BreakdownDonut slices={slices} totalKg={totalKg} />
      </div>

      {/* Equivalents */}
      <div className="rounded-card border border-forest-700/10 bg-cream-100 p-6">
        <p className="text-xs font-medium tracking-widest text-forest-700 uppercase">
          Equivalent to
        </p>
        <ul className="mt-4 space-y-3 text-sm text-ink-700">
          <Equiv label="mature trees / year to absorb" value={equivalents.trees} />
          <Equiv label="km in a petrol mid-size car" value={equivalents.carKm} />
          <Equiv
            label="smartphone charges"
            value={equivalents.smartphoneCharges}
          />
          <Equiv label="domestic flight minutes" value={equivalents.flightMinutes} />
        </ul>
      </div>

      {/* Offset cost */}
      <div className="rounded-card border border-amber-500/30 bg-amber-500/10 p-6">
        <p className="text-xs font-medium tracking-widest text-amber-600 uppercase">
          Estimated offset cost
        </p>
        <p className="mt-3 font-display text-4xl tabular text-amber-600">
          {formatINR(offset)}
        </p>
        <p className="mt-3 text-xs text-ink-500">
          At ~₹1,000 / tonne — Indian voluntary market mid-range. Offsetting is
          a last resort, not a substitute for reducing the footprint at source.
        </p>
      </div>

      {/* Top contributors */}
      <div className="rounded-card border border-forest-700/10 bg-bone-100 p-6 lg:col-span-2">
        <p className="text-xs font-medium tracking-widest text-forest-700 uppercase">
          Where to focus first
        </p>
        <ol className="mt-4 space-y-3">
          {top3.map((s, i) => (
            <li
              key={s.name}
              className="flex items-center justify-between gap-4 border-b border-forest-700/10 pb-3 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium"
                  style={{ background: s.color, color: "#FAF6EE" }}
                >
                  {i + 1}
                </span>
                <span className="font-medium text-ink-900">{s.name}</span>
              </div>
              <span className="tabular text-ink-700">
                {formatKg(s.value)}{" "}
                <span className="text-ink-400">
                  ({formatNumber((s.value / totalKg) * 100, { maximumFractionDigits: 0 })}%)
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Trend */}
      <div className="rounded-card border border-forest-700/10 bg-bone-100 p-6 lg:col-span-3">
        <p className="text-xs font-medium tracking-widest text-forest-700 uppercase">
          Recent calculations
        </p>
        <div className="mt-4 h-[180px]">
          <TrendArea
            data={history
              .map((h) => ({
                kg: Number(h.total_kgco2e),
                when: new Date(h.created_at).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                }),
              }))
              .reverse()}
          />
        </div>
      </div>
    </div>
  );
}

function ComparisonBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(200, pct));
  const isOver = pct > 100;
  return (
    <div className="mt-5">
      <div className="h-2 w-full overflow-hidden rounded-pill bg-forest-700/10">
        <div
          className={isOver ? "h-full bg-amber-500" : "h-full bg-forest-700"}
          style={{ width: `${(clamped / 200) * 100}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-400 tabular">
        <span>0</span>
        <span>India avg</span>
        <span>2× avg</span>
      </div>
    </div>
  );
}

function Equiv({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-ink-500">{label}</span>
      <span className="font-display text-xl tabular text-ink-900">
        {formatNumber(value, { maximumFractionDigits: 0 })}
      </span>
    </li>
  );
}
