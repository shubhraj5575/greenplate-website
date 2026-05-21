/**
 * Individual carbon-footprint calculator.
 *
 * Pure function: takes a typed `IndividualInputs` object, returns a
 * `IndividualResult` with totals + category breakdown + top contributors.
 *
 * Convention: ALL intermediate values are kg CO2e per YEAR. The wizard
 * normalizes monthly/weekly inputs (e.g. kWh/month, km/week) up to annual
 * here, so the engine itself never has to think about period.
 */

import { z } from "zod";
import {
  FACTORS,
  DIET_KG_CO2E_PER_DAY,
  CONSUMPTION_LEVELS,
  type DietPattern,
} from "./factors";

// ---------------- Inputs (Zod for runtime + Zod-inferred types) ----------------

export const householdSchema = z.object({
  electricity_kwh_per_month: z.number().min(0).max(20000),
  lpg_cylinders_per_month: z.number().min(0).max(20).default(0),
  png_m3_per_month: z.number().min(0).max(2000).default(0),
  water_l_per_day: z.number().min(0).max(2000).default(150),
  household_size: z.number().int().min(1).max(30).default(1),
});

export const transportSchema = z.object({
  car_km_per_week: z.number().min(0).max(5000).default(0),
  car_fuel: z
    .enum(["petrol_small", "petrol_mid", "diesel_mid", "cng"])
    .default("petrol_mid"),
  two_wheeler_km_per_week: z.number().min(0).max(2000).default(0),
  bus_km_per_week: z.number().min(0).max(2000).default(0),
  metro_km_per_week: z.number().min(0).max(2000).default(0),
  auto_km_per_week: z.number().min(0).max(2000).default(0),
  train_km_per_year: z.number().min(0).max(50000).default(0),
  flights_domestic_per_year: z.number().min(0).max(200).default(0),
  flights_intl_per_year: z.number().min(0).max(50).default(0),
});

export const foodSchema = z.object({
  diet_pattern: z
    .enum([
      "vegan",
      "lacto_veg",
      "ovo_veg",
      "non_veg_occasional",
      "non_veg_regular",
    ])
    .default("lacto_veg"),
  meat_servings_per_week: z.number().min(0).max(50).default(0),
  dairy_servings_per_day: z.number().min(0).max(20).default(2),
  eating_out_meals_per_week: z.number().min(0).max(50).default(2),
});

export const consumptionSchema = z.object({
  clothing_level: z.enum(["low", "med", "high"]).default("med"),
  electronics_level: z.enum(["low", "med", "high"]).default("med"),
  household_waste_kg_per_week: z.number().min(0).max(200).default(5),
  composts: z.boolean().default(false),
  recycles: z.boolean().default(false),
});

export const individualInputsSchema = z.object({
  household: householdSchema,
  transport: transportSchema,
  food: foodSchema,
  consumption: consumptionSchema,
});

export type IndividualInputs = z.infer<typeof individualInputsSchema>;

// ---------------- Output ----------------

export interface CategoryBreakdown {
  electricity: number;
  cooking_fuel: number;
  water: number;
  road_transport: number;
  rail_transport: number;
  air_transport: number;
  food: number;
  waste: number;
  clothing: number;
  electronics: number;
}

export interface IndividualResult {
  annualKg: number;
  monthlyKg: number;
  breakdown: CategoryBreakdown;
  topContributors: Array<{ category: keyof CategoryBreakdown; kg: number; pct: number }>;
  perCapitaShare: number; // annual / household_size
}

// ---------------- Calculation ----------------

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;
const DAYS_PER_YEAR = 365;
const LPG_CYLINDER_KG = 14.2;

function carFactor(fuel: IndividualInputs["transport"]["car_fuel"]): number {
  switch (fuel) {
    case "petrol_small":
      return FACTORS.car_petrol_small_km;
    case "petrol_mid":
      return FACTORS.car_petrol_mid_km;
    case "diesel_mid":
      return FACTORS.car_diesel_mid_km;
    case "cng":
      return FACTORS.car_cng_km;
  }
}

// The per-day numbers in DIET_KG_CO2E_PER_DAY are *full-diet* averages that
// already bake in typical Indian meat/dairy/out-eating amounts for the pattern.
// We therefore treat the serving fields as informational refinements collected
// in the wizard but NOT additive in the calc — using them as adders here would
// double-count. The Phase 5 menu builder provides per-ingredient precision.
function foodAnnualKg(food: IndividualInputs["food"]): number {
  return DIET_KG_CO2E_PER_DAY[food.diet_pattern as DietPattern] * DAYS_PER_YEAR;
}

function wasteAnnualKg(c: IndividualInputs["consumption"]): number {
  const annualKgWaste = c.household_waste_kg_per_week * WEEKS_PER_YEAR;
  // Disposal mix heuristic: compost → 30%, recycle → 25%, landfill rest.
  let landfillShare = 1;
  let compostShare = 0;
  let recycleShare = 0;
  if (c.composts) {
    compostShare += 0.3;
    landfillShare -= 0.3;
  }
  if (c.recycles) {
    recycleShare += 0.25;
    landfillShare -= 0.25;
  }
  landfillShare = Math.max(0, landfillShare);
  return (
    annualKgWaste * landfillShare * FACTORS.waste_landfill_kg +
    annualKgWaste * compostShare * FACTORS.waste_compost_kg +
    annualKgWaste * recycleShare * FACTORS.waste_recycle_kg
  );
}

export function calculateIndividual(
  inputs: IndividualInputs,
): IndividualResult {
  // Validate (throws on bad input — caller should already validate via RHF)
  individualInputsSchema.parse(inputs);

  const { household: h, transport: t, food, consumption: c } = inputs;

  // Household — total for the whole household; per-capita is reported separately
  const electricity =
    h.electricity_kwh_per_month * MONTHS_PER_YEAR * FACTORS.electricity_grid;
  const cooking_fuel =
    h.lpg_cylinders_per_month *
      MONTHS_PER_YEAR *
      LPG_CYLINDER_KG *
      FACTORS.lpg +
    h.png_m3_per_month * MONTHS_PER_YEAR * FACTORS.png;
  const water =
    ((h.water_l_per_day * DAYS_PER_YEAR) / 1000) * FACTORS.water_m3;

  // Transport
  const car_factor = carFactor(t.car_fuel);
  const road_transport =
    t.car_km_per_week * WEEKS_PER_YEAR * car_factor +
    t.two_wheeler_km_per_week * WEEKS_PER_YEAR * FACTORS.two_wheeler_km +
    t.bus_km_per_week * WEEKS_PER_YEAR * FACTORS.bus_pkm +
    t.auto_km_per_week * WEEKS_PER_YEAR * FACTORS.auto_rickshaw_km;
  const rail_transport =
    t.train_km_per_year * FACTORS.rail_electric_pkm +
    t.metro_km_per_week * WEEKS_PER_YEAR * FACTORS.metro_pkm;
  // Domestic flight ≈ 1000 km avg; international ≈ 5000 km avg
  const air_transport =
    t.flights_domestic_per_year * 1000 * FACTORS.flight_domestic_pkm +
    t.flights_intl_per_year * 5000 * FACTORS.flight_intl_pkm;

  // Food
  const foodKg = foodAnnualKg(food);

  // Waste
  const wasteKg = wasteAnnualKg(c);

  // Consumption
  const clothing = CONSUMPTION_LEVELS.clothing[c.clothing_level];
  const electronics = CONSUMPTION_LEVELS.electronics[c.electronics_level];

  const breakdown: CategoryBreakdown = {
    electricity,
    cooking_fuel,
    water,
    road_transport,
    rail_transport,
    air_transport,
    food: foodKg,
    waste: wasteKg,
    clothing,
    electronics,
  };

  const annualKg = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const monthlyKg = annualKg / MONTHS_PER_YEAR;

  const topContributors = (
    Object.entries(breakdown) as [keyof CategoryBreakdown, number][]
  )
    .map(([category, kg]) => ({
      category,
      kg,
      pct: annualKg > 0 ? (kg / annualKg) * 100 : 0,
    }))
    .sort((a, b) => b.kg - a.kg)
    .slice(0, 3);

  return {
    annualKg,
    monthlyKg,
    breakdown,
    topContributors,
    perCapitaShare: annualKg / h.household_size,
  };
}
