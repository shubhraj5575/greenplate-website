"use client";

import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

interface BaseProps {
  name: string;
  label: string;
  hint?: string;
  unit?: string;
}

export function NumberField({
  name,
  label,
  hint,
  unit,
  min,
  max,
  step,
}: BaseProps & { min?: number; max?: number; step?: number }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const err = getNestedError(errors, name);
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between text-xs font-medium text-ink-500 uppercase tracking-wide">
        <span>{label}</span>
        {unit && (
          <span className="text-[10px] normal-case tracking-normal text-ink-300">
            {unit}
          </span>
        )}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step={step ?? "any"}
        min={min}
        max={max}
        {...register(name, { valueAsNumber: true })}
        className={cn(
          "w-full rounded-pill border bg-cream-50 px-4 py-2.5 text-ink-900 outline-none transition focus:border-forest-700",
          err ? "border-danger" : "border-forest-700/15",
        )}
      />
      {hint && !err && (
        <span className="mt-1 block text-xs text-ink-400">{hint}</span>
      )}
      {err && (
        <span className="mt-1 block text-xs text-danger">{String(err.message)}</span>
      )}
    </label>
  );
}

export function SelectField({
  name,
  label,
  options,
  hint,
}: BaseProps & { options: { value: string; label: string }[] }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const err = getNestedError(errors, name);
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-500 uppercase tracking-wide">
        {label}
      </span>
      <select
        {...register(name)}
        className={cn(
          "w-full rounded-pill border bg-cream-50 px-4 py-2.5 text-ink-900 outline-none transition focus:border-forest-700",
          err ? "border-danger" : "border-forest-700/15",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && !err && (
        <span className="mt-1 block text-xs text-ink-400">{hint}</span>
      )}
      {err && (
        <span className="mt-1 block text-xs text-danger">{String(err.message)}</span>
      )}
    </label>
  );
}

export function SegmentedField({
  name,
  label,
  options,
}: BaseProps & { options: { value: string; label: string }[] }) {
  const { register, watch, setValue } = useFormContext();
  const value = watch(name);
  // ensure RHF knows about the field
  register(name);
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-ink-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = String(value) === o.value;
          return (
            <button
              type="button"
              key={o.value}
              onClick={() =>
                setValue(name, o.value, { shouldValidate: true, shouldDirty: true })
              }
              className={cn(
                "rounded-pill border px-4 py-1.5 text-sm transition",
                active
                  ? "border-forest-700 bg-forest-700 text-cream-50"
                  : "border-forest-700/15 bg-cream-50 text-ink-700 hover:border-forest-700/40",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ToggleField({ name, label }: { name: string; label: string }) {
  const { register, watch, setValue } = useFormContext();
  const value = !!watch(name);
  register(name);
  return (
    <button
      type="button"
      onClick={() => setValue(name, !value, { shouldDirty: true })}
      className={cn(
        "flex w-full items-center justify-between rounded-card border bg-cream-50 px-4 py-3 text-sm transition",
        value
          ? "border-forest-700 bg-forest-700/5"
          : "border-forest-700/15 hover:border-forest-700/40",
      )}
    >
      <span className="text-ink-700">{label}</span>
      <span
        className={cn(
          "h-5 w-9 rounded-full transition",
          value ? "bg-forest-700" : "bg-ink-300/40",
        )}
      >
        <span
          className={cn(
            "block h-5 w-5 rounded-full bg-cream-50 shadow-soft transition",
            value && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}

function getNestedError(
  errors: Record<string, unknown>,
  path: string,
): { message?: string } | undefined {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as object))
      return (acc as Record<string, unknown>)[key];
    return undefined;
  }, errors) as { message?: string } | undefined;
}
