"use client";

import { useState, useTransition } from "react";
import { completeOnboarding } from "@/app/(auth)/onboarding/actions";
import { cn } from "@/lib/utils";

export function OnboardingForm({
  defaultName,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const [accountType, setAccountType] = useState<"individual" | "organization">(
    "individual",
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await completeOnboarding(formData);
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <form action={onSubmit} className="space-y-8">
      {/* Account type chooser */}
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-ink-700">
          I&apos;m measuring for
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {(["individual", "organization"] as const).map((t) => (
            <label
              key={t}
              className={cn(
                "cursor-pointer rounded-card border p-5 transition",
                accountType === t
                  ? "border-forest-700 bg-forest-700/5"
                  : "border-forest-700/15 bg-cream-100 hover:border-forest-700/40",
              )}
            >
              <input
                type="radio"
                name="account_type"
                value={t}
                checked={accountType === t}
                onChange={() => setAccountType(t)}
                className="sr-only"
              />
              <div className="font-display text-xl text-forest-900">
                {t === "individual" ? "Just me" : "My organization"}
              </div>
              <div className="mt-1 text-sm text-ink-500">
                {t === "individual"
                  ? "Household + lifestyle footprint"
                  : "Restaurant / cafe / cloud kitchen"}
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Name + location */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="full_name" defaultValue={defaultName} required />
        <Field label="City" name="city" placeholder="e.g. Bengaluru" />
        <Field label="State" name="state" placeholder="e.g. Karnataka" />
        {accountType === "individual" && (
          <Field
            label="Household size"
            name="household_size"
            type="number"
            defaultValue="1"
            min={1}
            max={30}
          />
        )}
      </div>

      {/* Org fields */}
      {accountType === "organization" && (
        <fieldset className="space-y-4 rounded-card border border-forest-700/10 bg-bone-100 p-5">
          <legend className="px-2 text-xs font-medium tracking-widest text-forest-700 uppercase">
            About your organization
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Organization name" name="org_name" required />
            <SelectField
              label="Type"
              name="org_type"
              options={[
                { value: "restaurant", label: "Restaurant" },
                { value: "cafe", label: "Cafe" },
                { value: "cloud_kitchen", label: "Cloud kitchen" },
                { value: "bakery", label: "Bakery" },
                { value: "caterer", label: "Caterer" },
                { value: "other", label: "Other" },
              ]}
            />
            <Field
              label="Employees"
              name="org_employees"
              type="number"
              min={0}
              max={5000}
              placeholder="0"
            />
            <Field
              label="Seats (covers)"
              name="org_seats"
              type="number"
              min={0}
              max={2000}
              placeholder="0"
            />
          </div>
        </fieldset>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-forest-700 px-6 py-3 font-medium text-cream-50 transition hover:bg-forest-900 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-500 uppercase tracking-wide">
        {label}
      </span>
      <input
        name={name}
        type={type}
        className="w-full rounded-pill border border-forest-700/15 bg-cream-50 px-4 py-2.5 text-ink-900 outline-none transition focus:border-forest-700"
        {...rest}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-500 uppercase tracking-wide">
        {label}
      </span>
      <select
        name={name}
        className="w-full rounded-pill border border-forest-700/15 bg-cream-50 px-4 py-2.5 text-ink-900 outline-none transition focus:border-forest-700"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
