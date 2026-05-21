"use client";

import { NumberField, SegmentedField } from "@/components/calc/inputs/Field";

export function FoodStep() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl text-forest-900">Food</h2>
        <p className="mt-1 text-sm text-ink-500">
          Your diet pattern determines the food number. The serving fields are
          for your reference — they help us improve the model over time.
        </p>
      </header>

      <SegmentedField
        name="food.diet_pattern"
        label="Diet"
        options={[
          { value: "vegan", label: "Vegan" },
          { value: "lacto_veg", label: "Lacto-veg" },
          { value: "ovo_veg", label: "Ovo-veg" },
          { value: "non_veg_occasional", label: "Non-veg (occasional)" },
          { value: "non_veg_regular", label: "Non-veg (regular)" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField
          name="food.meat_servings_per_week"
          label="Meat servings"
          unit="per week"
          min={0}
          step={1}
        />
        <NumberField
          name="food.dairy_servings_per_day"
          label="Dairy servings"
          unit="per day"
          min={0}
          step={1}
        />
        <NumberField
          name="food.eating_out_meals_per_week"
          label="Meals eaten out"
          unit="per week"
          min={0}
          step={1}
        />
      </div>
    </div>
  );
}
