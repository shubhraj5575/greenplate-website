/**
 * India benchmark footprints for the comparison gauge on the dashboard.
 * All values in kg CO2e / year.
 */

export const INDIA_BENCHMARKS = {
  individual_avg: 1900, // OWID per-capita India 2023
  urban_middle_class_avg: 3500, // industry estimate
  global_avg: 4700, // OWID global per-capita
  paris_target_2030: 2300, // 1.5°C-aligned per-capita target
} as const;

export const RESTAURANT_BENCHMARKS = {
  per_cover_avg_kg: 2.8, // industry estimate, India urban restaurants
  per_cover_best_in_class_kg: 1.4, // top quartile vegetarian-leaning kitchens
} as const;

export function comparisonVsIndia(annualKg: number) {
  return {
    pctOfAvg: (annualKg / INDIA_BENCHMARKS.individual_avg) * 100,
    pctOfUrban: (annualKg / INDIA_BENCHMARKS.urban_middle_class_avg) * 100,
    pctOfGlobal: (annualKg / INDIA_BENCHMARKS.global_avg) * 100,
    deltaToParis: annualKg - INDIA_BENCHMARKS.paris_target_2030,
  };
}
