import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, opts: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
    ...opts,
  }).format(n);
}

export function formatKg(kg: number) {
  if (kg >= 1000) return `${formatNumber(kg / 1000)} t`;
  return `${formatNumber(kg)} kg`;
}

export function formatINR(rupees: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Coerce a form input value to a finite number, or undefined.
 *
 * React Hook Form's built-in `valueAsNumber: true` produces `NaN` from
 * empty inputs, which then fails Zod's `z.number()` with the developer-
 * facing message "Invalid input: expected number, received NaN".
 *
 * Use this with `register(name, { setValueAs: emptyToNumberOrUndefined })`
 * so the form state holds `undefined` for empty fields. Zod's `z.number()`
 * will then reject empty as "Required" — which is what users expect.
 */
export function emptyToNumberOrUndefined(v: unknown): number | undefined {
  if (v === "" || v === null || v === undefined) return undefined;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (trimmed === "") return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
  }
  if (typeof v === "number") {
    return Number.isFinite(v) ? v : undefined;
  }
  return undefined;
}
