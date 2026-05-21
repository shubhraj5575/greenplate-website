"use client";

import {
  calculateIndividual,
  type IndividualInputs,
} from "@/lib/calc/individual";
import { formatKg } from "@/lib/utils";

export function ResultsPreview({
  inputs,
}: {
  inputs: IndividualInputs | null;
}) {
  let total = 0;
  let topCategory = "";
  if (inputs) {
    try {
      const r = calculateIndividual(inputs);
      total = r.annualKg;
      topCategory = r.topContributors[0]?.category ?? "";
    } catch {
      // form not yet valid — show zeros
    }
  }

  return (
    <div className="mt-4">
      <p className="font-display text-3xl tabular text-forest-900">
        {formatKg(total)}{" "}
        <span className="text-base text-ink-500">/ year</span>
      </p>
      {topCategory && (
        <p className="mt-2 text-xs text-ink-500">
          Biggest contributor:{" "}
          <span className="font-medium text-ink-700">
            {topCategory.replace(/_/g, " ")}
          </span>
        </p>
      )}
      <p className="mt-4 text-xs leading-relaxed text-ink-400">
        Estimate updates live as you answer. Submit on the last step to save
        your result.
      </p>
    </div>
  );
}
