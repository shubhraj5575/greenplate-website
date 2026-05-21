"use client";

import { useState, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  individualInputsSchema,
  type IndividualInputs,
} from "@/lib/calc/individual";

type FormIn = z.input<typeof individualInputsSchema>;
import { HouseholdStep } from "./steps/HouseholdStep";
import { TransportStep } from "./steps/TransportStep";
import { FoodStep } from "./steps/FoodStep";
import { ConsumptionStep } from "./steps/ConsumptionStep";
import { ResultsPreview } from "./ResultsPreview";
import { submitIndividualCalc } from "@/app/(app)/calculate/actions";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "greenplate.calc.individual.draft";

const STEPS = [
  { label: "Household", Component: HouseholdStep },
  { label: "Transport", Component: TransportStep },
  { label: "Food", Component: FoodStep },
  { label: "Consumption", Component: ConsumptionStep },
] as const;

const DEFAULTS: FormIn = {
  household: {
    electricity_kwh_per_month: 200,
    lpg_cylinders_per_month: 1,
    png_m3_per_month: 0,
    water_l_per_day: 150,
    household_size: 1,
  },
  transport: {
    car_km_per_week: 0,
    car_fuel: "petrol_mid",
    two_wheeler_km_per_week: 0,
    bus_km_per_week: 0,
    metro_km_per_week: 0,
    auto_km_per_week: 0,
    train_km_per_year: 0,
    flights_domestic_per_year: 0,
    flights_intl_per_year: 0,
  },
  food: {
    diet_pattern: "lacto_veg",
    meat_servings_per_week: 0,
    dairy_servings_per_day: 2,
    eating_out_meals_per_week: 2,
  },
  consumption: {
    clothing_level: "med",
    electronics_level: "med",
    household_waste_kg_per_week: 5,
    composts: false,
    recycles: false,
  },
};

function loadDraft(): FormIn {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = individualInputsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as FormIn) : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function IndividualWizard() {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const methods = useForm<FormIn, unknown, IndividualInputs>({
    resolver: zodResolver(individualInputsSchema),
    defaultValues: loadDraft(),
    mode: "onBlur",
  });

  const values = methods.watch();
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {
      // quota exceeded — fine
    }
  }
  const previewInputs = (() => {
    const r = individualInputsSchema.safeParse(values);
    return r.success ? r.data : null;
  })();

  const isLast = step === STEPS.length - 1;
  const Step = STEPS[step].Component;

  async function onNext() {
    const fields = stepFields(step);
    const ok = await methods.trigger(fields, { shouldFocus: true });
    if (!ok) return;
    if (isLast) {
      setSubmitError(null);
      startTransition(async () => {
        const parsed = individualInputsSchema.parse(methods.getValues());
        const res = await submitIndividualCalc(parsed);
        if (res && !res.ok) setSubmitError(res.error);
        else
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
      });
    } else {
      setStep(step + 1);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <FormProvider {...methods}>
      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div>
          {/* Progress */}
          <ol className="mb-8 flex items-center gap-2 text-xs text-ink-400">
            {STEPS.map((s, i) => (
              <li
                key={s.label}
                className={cn(
                  "flex items-center gap-2",
                  i === step && "text-forest-900",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    i < step
                      ? "bg-forest-700 text-cream-50"
                      : i === step
                        ? "border border-forest-700 text-forest-900"
                        : "border border-forest-700/15 text-ink-300",
                  )}
                >
                  {i < step ? "✓" : i + 1}
                </span>
                <span
                  className={cn(
                    "uppercase tracking-wider",
                    i === step && "font-medium",
                  )}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="mx-2 h-px w-6 bg-forest-700/15" />
                )}
              </li>
            ))}
          </ol>

          <div className="rounded-card border border-forest-700/10 bg-bone-100 p-6">
            <Step />
          </div>

          {submitError && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {submitError}
            </p>
          )}

          <div className="mt-6 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0 || pending}
              className="rounded-full border border-forest-700/15 px-5 py-2.5 text-sm text-ink-700 transition hover:border-forest-700/40 disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={pending}
              className="rounded-full bg-forest-700 px-6 py-2.5 font-medium text-cream-50 transition hover:bg-forest-900 disabled:opacity-60"
            >
              {pending ? "Calculating…" : isLast ? "See my footprint" : "Next"}
            </button>
          </div>
        </div>

        <aside className="hidden md:block">
          <div className="sticky top-24 rounded-card border border-forest-700/10 bg-cream-100 p-5">
            <h3 className="text-xs font-medium tracking-widest text-forest-700 uppercase">
              Running estimate
            </h3>
            <ResultsPreview inputs={previewInputs} />
          </div>
        </aside>
      </div>
    </FormProvider>
  );
}

function stepFields(step: number): (keyof FormIn)[] {
  switch (step) {
    case 0:
      return ["household"];
    case 1:
      return ["transport"];
    case 2:
      return ["food"];
    case 3:
      return ["consumption"];
    default:
      return [];
  }
}
