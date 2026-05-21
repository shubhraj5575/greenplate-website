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
