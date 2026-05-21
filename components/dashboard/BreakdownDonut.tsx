"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatKg } from "@/lib/utils";

interface Slice {
  name: string;
  value: number;
  color: string;
}

export function BreakdownDonut({
  slices,
  totalKg,
}: {
  slices: Slice[];
  totalKg: number;
}) {
  if (!slices.length) {
    return <p className="mt-6 text-sm text-ink-400">No data yet.</p>;
  }
  return (
    <div className="relative mt-3 h-[220px] w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={slices}
            innerRadius={56}
            outerRadius={88}
            paddingAngle={1}
            dataKey="value"
            stroke="none"
          >
            {slices.map((s, i) => (
              <Cell key={i} fill={s.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => formatKg(typeof v === "number" ? v : Number(v))}
            contentStyle={{
              background: "#FAF6EE",
              border: "1px solid rgba(47,92,70,0.15)",
              borderRadius: 12,
              padding: 8,
            }}
            itemStyle={{ color: "#1F3A2E", fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] tracking-widest text-ink-400 uppercase">
          Total
        </span>
        <span className="font-display text-xl tabular text-forest-900">
          {formatKg(totalKg)}
        </span>
      </div>
    </div>
  );
}
