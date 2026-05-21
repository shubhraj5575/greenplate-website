"use client";

import {
  NumberField,
  SegmentedField,
  ToggleField,
} from "@/components/calc/inputs/Field";

export function ConsumptionStep() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl text-forest-900">
          Consumption & waste
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Almost done. New clothes and electronics carry a hidden footprint —
          and what you do with your waste matters.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <SegmentedField
          name="consumption.clothing_level"
          label="Clothing"
          options={[
            { value: "low", label: "Minimal" },
            { value: "med", label: "Moderate" },
            { value: "high", label: "Frequent" },
          ]}
        />
        <SegmentedField
          name="consumption.electronics_level"
          label="Electronics"
          options={[
            { value: "low", label: "Minimal" },
            { value: "med", label: "Moderate" },
            { value: "high", label: "Frequent" },
          ]}
        />
        <NumberField
          name="consumption.household_waste_kg_per_week"
          label="Household waste"
          unit="kg / week"
          min={0}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleField name="consumption.composts" label="We compost organics" />
        <ToggleField name="consumption.recycles" label="We segregate & recycle" />
      </div>
    </div>
  );
}
