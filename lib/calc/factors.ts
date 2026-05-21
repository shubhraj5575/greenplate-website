/**
 * Canonical emission factors for the calculator engines.
 *
 * Mirrors `supabase/migrations/20260521120200_seed_factors.sql` —
 * keep both in sync when changing values.
 * Citations live on /methodology, which reads from the DB.
 *
 * Units: kg CO2e per the unit named (kWh, kg, litre, m³, km, pkm).
 */

export type IndividualFactorKey =
  | "electricity_grid"
  | "lpg"
  | "png"
  | "petrol"
  | "diesel"
  | "cng_kg"
  | "two_wheeler_km"
  | "car_petrol_small_km"
  | "car_petrol_mid_km"
  | "car_diesel_mid_km"
  | "car_cng_km"
  | "auto_rickshaw_km"
  | "bus_pkm"
  | "taxi_pkm"
  | "rail_electric_pkm"
  | "rail_diesel_pkm"
  | "metro_pkm"
  | "flight_domestic_pkm"
  | "flight_intl_pkm"
  | "water_m3"
  | "waste_landfill_kg"
  | "waste_compost_kg"
  | "waste_recycle_kg";

export const FACTORS: Record<IndividualFactorKey, number> = {
  electricity_grid: 0.716, // kg CO2/kWh — CEA 2023 national avg
  lpg: 2.98, // kg CO2/kg — IPCC default
  png: 2.02, // kg CO2/m³ — PNGRB
  petrol: 2.31, // kg CO2/litre — DEFRA
  diesel: 2.68, // kg CO2/litre — DEFRA
  cng_kg: 2.75, // kg CO2/kg — IPCC
  two_wheeler_km: 0.04, // kg CO2/km — ICAT
  car_petrol_small_km: 0.142,
  car_petrol_mid_km: 0.165,
  car_diesel_mid_km: 0.175,
  car_cng_km: 0.11,
  auto_rickshaw_km: 0.115,
  bus_pkm: 0.07,
  taxi_pkm: 0.15,
  rail_electric_pkm: 0.008,
  rail_diesel_pkm: 0.027,
  metro_pkm: 0.014,
  flight_domestic_pkm: 0.133,
  flight_intl_pkm: 0.148,
  water_m3: 0.344,
  waste_landfill_kg: 0.6,
  waste_compost_kg: 0.05,
  waste_recycle_kg: 0.15,
};

// Refrigerants — GWP (multiply by kg leaked / topped up).
export const REFRIGERANT_GWP: Record<string, number> = {
  r134a: 1430,
  r410a: 2088,
  r404a: 3922,
  r290: 3,
};

// Packaging — kg CO2e per kg material.
export const PACKAGING_KG: Record<string, number> = {
  plastic_pet: 6.0,
  plastic_hdpe: 1.9,
  paper_cardboard: 1.4,
  aluminium: 9.0,
  glass: 0.85,
  steel_tin: 2.6,
};

// Average daily-grams-per-serving by diet pattern — used by the food step.
// These are simplified composite numbers blending the Indian dataset; users
// can later switch to the menu-item analyzer for higher precision.
export type DietPattern =
  | "vegan"
  | "lacto_veg"
  | "ovo_veg"
  | "non_veg_occasional"
  | "non_veg_regular";

export const DIET_KG_CO2E_PER_DAY: Record<DietPattern, number> = {
  vegan: 1.5,
  lacto_veg: 2.4,
  ovo_veg: 2.7,
  non_veg_occasional: 3.3,
  non_veg_regular: 5.1,
};

// Per-serving adders for meat / dairy / eating out.
export const FOOD_ADDERS = {
  meat_serving_kg: 1.5, // kg CO2e per serving of meat
  dairy_serving_kg: 0.45, // per serving of milk/curd/paneer
  eating_out_meal_kg: 0.8, // marginal vs cooking same meal at home
};

// Consumption (clothing, electronics) low/med/high annual kgCO2e
export const CONSUMPTION_LEVELS = {
  clothing: { low: 150, med: 350, high: 700 }, // kg/year
  electronics: { low: 100, med: 280, high: 600 }, // kg/year
};
