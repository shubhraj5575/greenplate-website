"use client";

import { useState, useTransition } from "react";
import { useFormContext } from "react-hook-form";
import { searchFoodItems } from "@/app/(app)/org/calculate/actions";
import { formatKg } from "@/lib/utils";

type FoodResult = {
  id: string;
  display_name: string;
  category: string;
  kgco2e_per_kg: number;
  geographic_scope: string | null;
};

function FoodItemCombobox({
  onSelect,
}: {
  onSelect: (item: FoodResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleChange(value: string) {
    setQuery(value);
    if (value.length < 2) { setResults([]); setOpen(false); return; }
    startTransition(async () => {
      const data = await searchFoodItems(value);
      setResults(data);
      setOpen(data.length > 0);
    });
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={e => handleChange(e.target.value)}
        placeholder="Search food items…"
        className="w-full rounded-pill border border-forest-700/15 bg-cream-50 px-4 py-2.5 text-sm text-ink-900 outline-none transition focus:border-forest-700"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-2xl border border-forest-700/15 bg-cream-50 shadow-[var(--shadow-card)]">
          {results.map(r => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => { onSelect(r); setQuery(r.display_name); setOpen(false); }}
                className="w-full px-4 py-2.5 text-left hover:bg-forest-700/5"
              >
                <span className="block text-sm font-medium text-ink-900">{r.display_name}</span>
                <span className="block text-xs text-ink-400">
                  {r.category}{r.geographic_scope ? ` · ${r.geographic_scope}` : ""} · {r.kgco2e_per_kg.toFixed(2)} kg CO₂e/kg
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MenuSection({
  items,
  onAdd,
  onAddIngredient,
  onRemove,
}: {
  items: { id: string; kind?: string }[];
  onAdd: () => void;
  onAddIngredient: (item: FoodResult) => void;
  onRemove: (i: number) => void;
}) {
  const { register, watch } = useFormContext();

  return (
    <div className="space-y-5">
      <header>
        <h3 className="font-display text-xl text-forest-900">Menu items</h3>
        <p className="mt-1 text-sm text-ink-500">
          Search our 1,500+ Indian food database to add ingredient-level items, or add dishes manually with a per-serving factor.
        </p>
      </header>

      {/* Food DB search */}
      <div className="rounded-card border border-forest-700/10 bg-cream-50 p-4">
        <p className="mb-2 text-xs font-medium text-ink-500 uppercase tracking-wide">Add from food database</p>
        <FoodItemCombobox onSelect={onAddIngredient} />
      </div>

      <div className="space-y-3">
        {items.map((f, i) => {
          const kind = watch(`scope3.menu_items.${i}.kind`);
          return (
            <div key={f.id} className="grid items-end gap-3 rounded-card border border-forest-700/10 bg-cream-50 p-4 sm:grid-cols-[1fr_140px_auto]">
              {kind === "ingredient" ? (
                <>
                  <div>
                    <span className="mb-1 block text-xs font-medium text-ink-500 uppercase tracking-wide">Ingredient</span>
                    <p className="rounded-pill border border-forest-700/10 bg-bone-100 px-4 py-2.5 text-sm text-ink-700">
                      {watch(`scope3.menu_items.${i}.food_item_name`)}
                      <span className="ml-2 text-xs text-ink-400">{watch(`scope3.menu_items.${i}.kgco2e_per_kg`)} kg CO₂e/kg</span>
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-500 uppercase tracking-wide">kg / month</label>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      {...register(`scope3.menu_items.${i}.kg_per_month`, { valueAsNumber: true })}
                      className="w-full rounded-pill border border-forest-700/15 bg-cream-50 px-4 py-2.5 text-sm text-ink-900 outline-none transition focus:border-forest-700"
                    />
                  </div>
                  <div className="text-right text-xs text-ink-400">
                    {(() => {
                      const kg = watch(`scope3.menu_items.${i}.kg_per_month`) || 0;
                      const factor = watch(`scope3.menu_items.${i}.kgco2e_per_kg`) || 0;
                      return formatKg(kg * factor * 12) + " / yr";
                    })()}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-500 uppercase tracking-wide">Dish</label>
                    <input
                      {...register(`scope3.menu_items.${i}.name`)}
                      placeholder="e.g. Paneer Tikka"
                      className="w-full rounded-pill border border-forest-700/15 bg-cream-50 px-4 py-2.5 text-sm text-ink-900 outline-none transition focus:border-forest-700"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-500 uppercase tracking-wide">kg CO₂e / serving</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      {...register(`scope3.menu_items.${i}.kgco2e_per_serving`, { valueAsNumber: true })}
                      className="w-full rounded-pill border border-forest-700/15 bg-cream-50 px-4 py-2.5 text-sm text-ink-900 outline-none transition focus:border-forest-700"
                    />
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-xs text-ink-400 hover:text-red-600"
                aria-label="Remove"
              >
                Remove
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={onAdd}
          className="rounded-pill border border-dashed border-forest-700/30 px-4 py-2 text-sm text-forest-700 hover:bg-forest-700/5"
        >
          + Add manually
        </button>
      </div>
    </div>
  );
}
