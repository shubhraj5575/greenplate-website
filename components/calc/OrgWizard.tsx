"use client";

import { useState, useTransition } from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  orgInputsSchema,
  type OrgInputs,
  calculateOrganization,
} from "@/lib/calc/organization";
import {
  NumberField,
  SegmentedField,
  SelectField,
} from "@/components/calc/inputs/Field";
import { submitOrgCalc } from "@/app/(app)/org/calculate/actions";
import { formatKg } from "@/lib/utils";
import { cn } from "@/lib/utils";

type FormIn = z.input<typeof orgInputsSchema>;

const STORAGE_KEY = "greenplate.calc.org.draft";

const SECTIONS = [
  { id: "scope1", label: "Scope 1 · Combustion + refrigerants" },
  { id: "scope2", label: "Scope 2 · Electricity" },
  { id: "menu", label: "Scope 3a · Menu items" },
  { id: "logistics", label: "Scope 3b · Logistics, waste, packaging, commute" },
] as const;

export function OrgWizard({
  orgId,
  seats,
  employees,
}: {
  orgId: string;
  seats: number;
  employees: number;
}) {
  const [section, setSection] = useState<(typeof SECTIONS)[number]["id"]>(
    "scope1",
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const defaults: FormIn = {
    scope1: {
      lpg_kg_per_month: 0,
      lpg_cylinders_per_month: 0,
      png_m3_per_month: 0,
      diesel_l_per_month: 0,
      refrigerant_type: "none",
      refrigerant_kg_per_year: 0,
    },
    scope2: { electricity_kwh_per_month: 0 },
    scope3: {
      menu_items: [],
      inbound_logistics_km_per_month: 0,
      food_waste_kg_per_month: 0,
      food_waste_disposal: "landfill",
      packaging_kg_per_month: {
        plastic_pet: 0,
        plastic_hdpe: 0,
        paper_cardboard: 0,
        aluminium: 0,
        glass: 0,
        steel_tin: 0,
      },
      employees,
      employee_avg_commute_km_per_day: 0,
      employee_dominant_mode: "two_wheeler",
    },
    seats,
  };

  const methods = useForm<FormIn, unknown, OrgInputs>({
    resolver: zodResolver(orgInputsSchema),
    defaultValues: loadDraft(defaults),
    mode: "onBlur",
  });

  const values = methods.watch();
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {}
  }

  const preview = (() => {
    const r = orgInputsSchema.safeParse(values);
    return r.success ? calculateOrganization(r.data) : null;
  })();

  const menuArr = useFieldArray({
    control: methods.control,
    name: "scope3.menu_items",
  });

  async function onSubmit() {
    setError(null);
    startTransition(async () => {
      const ok = await methods.trigger();
      if (!ok) return;
      const parsed = orgInputsSchema.parse(methods.getValues());
      const res = await submitOrgCalc(orgId, parsed);
      if (res && !res.ok) setError(res.error);
      else
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
    });
  }

  async function onContinue() {
    setError(null);
    startTransition(async () => {
      const ok = await methods.trigger();
      if (!ok) return;
      const idx = SECTIONS.findIndex(s => s.id === section);
      const next = SECTIONS[idx + 1];
      if (next) setSection(next.id);
    });
  }

  const isLastSection = section === "logistics";

  return (
    <FormProvider {...methods}>
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <nav className="space-y-1 text-sm">
          {SECTIONS.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => setSection(s.id)}
              className={cn(
                "block w-full rounded-pill px-4 py-2 text-left transition",
                section === s.id
                  ? "bg-forest-700 text-cream-50"
                  : "text-ink-700 hover:bg-forest-700/5",
              )}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div>
          <div className="rounded-card border border-forest-700/10 bg-bone-100 p-6">
            {section === "scope1" && <Scope1Section />}
            {section === "scope2" && <Scope2Section />}
            {section === "menu" && (
              <MenuSection
                items={menuArr.fields}
                onAdd={() =>
                  menuArr.append({
                    name: "",
                    kgco2e_per_serving: 0,
                    monthly_servings: 0,
                  })
                }
                onRemove={menuArr.remove}
              />
            )}
            {section === "logistics" && <LogisticsSection />}
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-ink-500">
              Running total:{" "}
              <span className="tabular font-medium text-ink-900">
                {preview ? formatKg(preview.annualKg) + " / yr" : "—"}
              </span>
              {preview?.perCoverDailyKg && (
                <span className="ml-3 text-ink-400">
                  · {formatKg(preview.perCoverDailyKg)} per cover/day
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={isLastSection ? onSubmit : onContinue}
              className="inline-flex items-center gap-2 rounded-full bg-forest-700 px-6 py-2.5 font-medium text-cream-50 transition hover:bg-forest-900 disabled:opacity-60"
            >
              {pending && (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {pending ? "Saving…" : isLastSection ? "Save calculation" : "Save & continue"}
            </button>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}

function loadDraft(fallback: FormIn): FormIn {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = orgInputsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as FormIn) : fallback;
  } catch {
    return fallback;
  }
}

function Scope1Section() {
  return (
    <div className="space-y-5">
      <header>
        <h3 className="font-display text-xl text-forest-900">
          On-site combustion + refrigerants
        </h3>
        <p className="mt-1 text-sm text-ink-500">
          Kitchen gas, backup diesel, and any HFC refrigerant top-ups in your
          cold storage / ACs.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          name="scope1.lpg_kg_per_month"
          label="LPG"
          unit="kg / month"
          min={0}
        />
        <NumberField
          name="scope1.lpg_cylinders_per_month"
          label="…or LPG cylinders (14.2 kg)"
          unit="cylinders / month"
          min={0}
        />
        <NumberField
          name="scope1.png_m3_per_month"
          label="Piped natural gas (PNG)"
          unit="m³ / month"
          min={0}
        />
        <NumberField
          name="scope1.diesel_l_per_month"
          label="Diesel (backup gen)"
          unit="litres / month"
          min={0}
        />
        <SelectField
          name="scope1.refrigerant_type"
          label="Refrigerant"
          options={[
            { value: "none", label: "None / unknown" },
            { value: "r134a", label: "R-134a" },
            { value: "r410a", label: "R-410A" },
            { value: "r404a", label: "R-404A" },
            { value: "r290", label: "R-290 (propane)" },
          ]}
        />
        <NumberField
          name="scope1.refrigerant_kg_per_year"
          label="Refrigerant added / year"
          unit="kg / year"
          min={0}
          step={0.1}
        />
      </div>
    </div>
  );
}

function Scope2Section() {
  return (
    <div className="space-y-5">
      <header>
        <h3 className="font-display text-xl text-forest-900">
          Purchased electricity
        </h3>
        <p className="mt-1 text-sm text-ink-500">
          Total kWh from grid each month (check your DISCOM bill).
        </p>
      </header>
      <NumberField
        name="scope2.electricity_kwh_per_month"
        label="Electricity"
        unit="kWh / month"
        min={0}
      />
    </div>
  );
}

function MenuSection({
  items,
  onAdd,
  onRemove,
}: {
  items: { id: string }[];
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="space-y-5">
      <header>
        <h3 className="font-display text-xl text-forest-900">Menu items</h3>
        <p className="mt-1 text-sm text-ink-500">
          Add your most-served dishes. Per-serving kg CO₂e × monthly servings
          gives the ingredient footprint. The standalone menu builder will
          autocomplete from our 1,500+ Indian food database once it&apos;s
          loaded.
        </p>
      </header>
      <div className="space-y-3">
        {items.map((f, i) => (
          <div
            key={f.id}
            className="grid items-end gap-3 rounded-card border border-forest-700/10 bg-cream-50 p-4 sm:grid-cols-[1fr_140px_140px_auto]"
          >
            <NumberFieldText
              name={`scope3.menu_items.${i}.name`}
              label="Dish"
              placeholder="e.g. Paneer Tikka"
            />
            <NumberField
              name={`scope3.menu_items.${i}.kgco2e_per_serving`}
              label="kg CO₂e / serving"
              min={0}
              step={0.01}
            />
            <NumberField
              name={`scope3.menu_items.${i}.monthly_servings`}
              label="Servings / month"
              min={0}
              step={1}
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="text-xs text-ink-400 hover:text-danger"
              aria-label="Remove"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="rounded-pill border border-dashed border-forest-700/30 px-4 py-2 text-sm text-forest-700 hover:bg-forest-700/5"
        >
          + Add menu item
        </button>
      </div>
    </div>
  );
}

// Plain text input — the Field component only does number/select/toggle
function NumberFieldText({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-500 uppercase tracking-wide">
        {label}
      </span>
      <input
        name={name}
        placeholder={placeholder}
        className="w-full rounded-pill border border-forest-700/15 bg-cream-50 px-4 py-2.5 text-ink-900 outline-none transition focus:border-forest-700"
      />
    </label>
  );
}

function LogisticsSection() {
  return (
    <div className="space-y-6">
      <header>
        <h3 className="font-display text-xl text-forest-900">
          Logistics, waste, packaging, commute
        </h3>
        <p className="mt-1 text-sm text-ink-500">
          Indirect emissions tied to running the kitchen.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          name="scope3.inbound_logistics_km_per_month"
          label="Inbound delivery distance"
          unit="km / month"
          min={0}
        />
        <NumberField
          name="scope3.food_waste_kg_per_month"
          label="Food waste"
          unit="kg / month"
          min={0}
        />
        <SegmentedField
          name="scope3.food_waste_disposal"
          label="Waste disposal"
          options={[
            { value: "landfill", label: "Landfill" },
            { value: "compost", label: "Compost" },
            { value: "anaerobic", label: "Anaerobic" },
          ]}
        />
      </div>

      <fieldset>
        <legend className="mb-3 text-xs font-medium text-ink-500 uppercase tracking-wide">
          Packaging (kg / month)
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField
            name="scope3.packaging_kg_per_month.plastic_pet"
            label="PET plastic"
            min={0}
          />
          <NumberField
            name="scope3.packaging_kg_per_month.plastic_hdpe"
            label="HDPE plastic"
            min={0}
          />
          <NumberField
            name="scope3.packaging_kg_per_month.paper_cardboard"
            label="Paper / cardboard"
            min={0}
          />
          <NumberField
            name="scope3.packaging_kg_per_month.aluminium"
            label="Aluminium"
            min={0}
          />
          <NumberField
            name="scope3.packaging_kg_per_month.glass"
            label="Glass"
            min={0}
          />
          <NumberField
            name="scope3.packaging_kg_per_month.steel_tin"
            label="Steel / tin"
            min={0}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-medium text-ink-500 uppercase tracking-wide">
          Employee commute
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField
            name="scope3.employees"
            label="Employees"
            min={0}
            step={1}
          />
          <NumberField
            name="scope3.employee_avg_commute_km_per_day"
            label="Avg one-way commute"
            unit="km / day"
            min={0}
          />
          <SegmentedField
            name="scope3.employee_dominant_mode"
            label="Mode"
            options={[
              { value: "two_wheeler", label: "2-wheeler" },
              { value: "car_petrol", label: "Car" },
              { value: "bus", label: "Bus" },
              { value: "metro", label: "Metro" },
              { value: "walk_cycle", label: "Walk / cycle" },
            ]}
          />
        </div>
      </fieldset>
    </div>
  );
}
