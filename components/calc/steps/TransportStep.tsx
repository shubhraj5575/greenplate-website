"use client";

import {
  NumberField,
  SegmentedField,
} from "@/components/calc/inputs/Field";

export function TransportStep() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl text-forest-900">Transport</h2>
        <p className="mt-1 text-sm text-ink-500">
          How you get around. Cars and flights are usually the biggest
          contributors here.
        </p>
      </header>

      <fieldset className="space-y-4">
        <SegmentedField
          name="transport.car_fuel"
          label="Car fuel"
          options={[
            { value: "petrol_small", label: "Petrol (small)" },
            { value: "petrol_mid", label: "Petrol (mid)" },
            { value: "diesel_mid", label: "Diesel" },
            { value: "cng", label: "CNG" },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            name="transport.car_km_per_week"
            label="Car kilometres"
            unit="km / week"
            min={0}
          />
          <NumberField
            name="transport.two_wheeler_km_per_week"
            label="Two-wheeler"
            unit="km / week"
            min={0}
          />
          <NumberField
            name="transport.auto_km_per_week"
            label="Auto-rickshaw"
            unit="km / week"
            min={0}
          />
          <NumberField
            name="transport.bus_km_per_week"
            label="Bus"
            unit="km / week"
            min={0}
          />
          <NumberField
            name="transport.metro_km_per_week"
            label="Metro / urban rail"
            unit="km / week"
            min={0}
          />
          <NumberField
            name="transport.train_km_per_year"
            label="Long-distance train"
            unit="km / year"
            min={0}
          />
          <NumberField
            name="transport.flights_domestic_per_year"
            label="Domestic flights"
            unit="trips / year"
            min={0}
            step={1}
          />
          <NumberField
            name="transport.flights_intl_per_year"
            label="International flights"
            unit="trips / year"
            min={0}
            step={1}
          />
        </div>
      </fieldset>
    </div>
  );
}
