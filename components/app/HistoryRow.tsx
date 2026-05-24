"use client";
import Link from "next/link";
import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { renameCalculation } from "@/app/(app)/history/actions";
import { formatKg } from "@/lib/utils";

interface Props {
  row: {
    id: string;
    calc_type: string;
    total_kgco2e: number | string;
    created_at: string;
    name: string | null;
  };
  index: number;
  total: number;
}

export function HistoryRow({ row, index, total }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(row.name ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await renameCalculation(row.id, value);
    setSaving(false);
    setEditing(false);
  }

  const displayName = row.name || row.calc_type.replace(/_/g, " ");

  return (
    <li className="relative flex items-center justify-between gap-4 rounded-card border border-forest-700/10 bg-cream-50 px-5 py-4 transition-all duration-200 hover:-translate-y-px hover:border-forest-700/25 hover:shadow-[var(--shadow-soft)]">
      {/* Stretched link — fills the card but sits behind interactive elements */}
      <Link
        href={`/dashboard?calc=${row.id}`}
        className="absolute inset-0 rounded-card"
        aria-label={`Open ${displayName}`}
      />

      <div className="relative flex items-center gap-4 z-10">
        {/* Run number badge */}
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-700/8 font-display text-sm text-forest-700">
          {total - index}
        </span>
        <div>
          {editing ? (
            <div className="flex items-center gap-2" onClick={e => e.preventDefault()}>
              <input
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
                className="rounded border border-forest-700/20 bg-cream-50 px-2 py-1 text-sm text-ink-900 outline-none focus:border-forest-700"
                autoFocus
              />
              <button onClick={save} disabled={saving} className="text-forest-700 hover:text-forest-900" aria-label="Save name">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => setEditing(false)} className="text-ink-400 hover:text-ink-700" aria-label="Cancel">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium capitalize text-ink-900">{displayName}</p>
              <button
                onClick={e => { e.preventDefault(); setEditing(true); }}
                className="text-ink-300 hover:text-forest-700 transition-colors"
                aria-label="Rename"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <p className="tabular text-xs text-ink-400">
            {new Date(row.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      <span className="relative z-10 tabular font-display text-xl text-forest-900">
        {formatKg(Number(row.total_kgco2e))}
      </span>
    </li>
  );
}
