"use client";

import { NumberField } from "@/components/calc/inputs/Field";

export function HouseholdStep() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl text-forest-900">Household</h2>
        <p className="mt-1 text-sm text-ink-500">
          Your monthly utility usage. Check a recent bill — even a rough
          estimate is fine.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          name="household.electricity_kwh_per_month"
          label="Electricity"
          unit="kWh / month"
          min={0}
        />
        <NumberField
          name="household.lpg_cylinders_per_month"
          label="LPG cylinders (14.2 kg)"
          unit="cylinders / month"
          min={0}
          step={0.1}
        />
        <NumberField
          name="household.png_m3_per_month"
          label="Piped gas (PNG)"
          unit="m³ / month"
          min={0}
        />
        <NumberField
          name="household.water_l_per_day"
          label="Water"
          unit="litres / day / person"
          min={0}
        />
        <NumberField
          name="household.household_size"
          label="People in household"
          min={1}
          max={30}
          step={1}
        />
      </div>
    </div>
  );
}
