"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatKg } from "@/lib/utils";

export function TrendArea({
  data,
}: {
  data: Array<{ kg: number; when: string }>;
}) {
  if (data.length < 2) {
    return (
      <p className="text-sm text-ink-400">
        Run another calculation to see a trend here.
      </p>
    );
  }
  return (
    <ResponsiveContainer>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2F5C46" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2F5C46" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(31,58,46,0.08)" vertical={false} />
        <XAxis
          dataKey="when"
          tick={{ fill: "#6b7d75", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => formatKg(v)}
          tick={{ fill: "#6b7d75", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip
          formatter={(v) => formatKg(typeof v === "number" ? v : Number(v))}
          contentStyle={{
            background: "#FAF6EE",
            border: "1px solid rgba(47,92,70,0.15)",
            borderRadius: 12,
          }}
          itemStyle={{ color: "#1F3A2E", fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="kg"
          stroke="#2F5C46"
          strokeWidth={2}
          fill="url(#trendFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
