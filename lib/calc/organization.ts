/**
 * Organization (food-service) carbon-footprint calculator.
 *
 * Pure function: takes typed `OrgInputs`, returns a `OrgResult` with
 * scope-1/2/3 breakdown, total, per-cover metric, and top menu offenders.
 *
 * Convention: ALL intermediate values are kg CO2e per YEAR.
 * The wizard normalizes monthly inputs up to annual here.
 *
 * Scope mapping (GHG Protocol):
 *   - Scope 1 → on-site combustion (kitchen LPG/PNG, diesel backup) + refrigerant leaks
 *   - Scope 2 → purchased electricity
 *   - Scope 3 → ingredients (menu) + inbound logistics + food waste + packaging + commute
 */

import { z } from "zod";
import { FACTORS, REFRIGERANT_GWP, PACKAGING_KG } from "./factors";

const MONTHS_PER_YEAR = 12;
const WEEKS_PER_YEAR = 52;
const LPG_CYLINDER_KG = 14.2;
const DOMESTIC_FLIGHT_KM_PROXY = 1000;

// ---------------- Inputs ----------------

export const scope1Schema = z.object({
  lpg_kg_per_month: z.number().min(0).max(50000).default(0),
  lpg_cylinders_per_month: z.number().min(0).max(500).default(0),
  png_m3_per_month: z.number().min(0).max(20000).default(0),
  diesel_l_per_month: z.number().min(0).max(50000).default(0),
  refrigerant_type: z
    .enum(["r134a", "r410a", "r404a", "r290", "none"])
    .default("none"),
  refrigerant_kg_per_year: z.number().min(0).max(100).default(0),
});

export const scope2Schema = z.object({
  electricity_kwh_per_month: z.number().min(0).max(500000),
});

export const menuItemSchema = z.object({
  name: z.string().min(1),
  kgco2e_per_serving: z.number().min(0).max(50),
  monthly_servings: z.number().int().min(0).max(1_000_000),
});

export const scope3Schema = z.object({
  menu_items: z.array(menuItemSchema).default([]),
  inbound_logistics_km_per_month: z.number().min(0).max(50000).default(0),
  food_waste_kg_per_month: z.number().min(0).max(50000).default(0),
  food_waste_disposal: z
    .enum(["landfill", "compost", "anaerobic"])
    .default("landfill"),
  packaging_kg_per_month: z
    .object({
      plastic_pet: z.number().min(0).default(0),
      plastic_hdpe: z.number().min(0).default(0),
      paper_cardboard: z.number().min(0).default(0),
      aluminium: z.number().min(0).default(0),
      glass: z.number().min(0).default(0),
      steel_tin: z.number().min(0).default(0),
    })
    .default({
      plastic_pet: 0,
      plastic_hdpe: 0,
      paper_cardboard: 0,
      aluminium: 0,
      glass: 0,
      steel_tin: 0,
    }),
  employees: z.number().int().min(0).max(5000).default(0),
  employee_avg_commute_km_per_day: z.number().min(0).max(500).default(0),
  employee_dominant_mode: z
    .enum(["two_wheeler", "car_petrol", "bus", "metro", "walk_cycle"])
    .default("two_wheeler"),
});

export const orgInputsSchema = z.object({
  scope1: scope1Schema,
  scope2: scope2Schema,
  scope3: scope3Schema,
  seats: z.number().int().min(0).max(2000).default(0),
});

export type OrgInputs = z.infer<typeof orgInputsSchema>;

// ---------------- Output ----------------

export interface OrgScopeBreakdown {
  scope1: {
    cooking_fuel: number;
    diesel_backup: number;
    refrigerant: number;
  };
  scope2: { electricity: number };
  scope3: {
    menu_ingredients: number;
    inbound_logistics: number;
    food_waste: number;
    packaging: number;
    commute: number;
  };
}

export interface OrgResult {
  annualKg: number;
  scope1Kg: number;
  scope2Kg: number;
  scope3Kg: number;
  breakdown: OrgScopeBreakdown;
  perCoverDailyKg: number | null; // null if seats === 0
  topMenuOffenders: Array<{
    name: string;
    annualKg: number;
    pctOfMenu: number;
  }>;
}

// ---------------- Calc ----------------

function commuteFactor(mode: OrgInputs["scope3"]["employee_dominant_mode"]) {
  switch (mode) {
    case "two_wheeler":
      return FACTORS.two_wheeler_km;
    case "car_petrol":
      return FACTORS.car_petrol_mid_km;
    case "bus":
      return FACTORS.bus_pkm;
    case "metro":
      return FACTORS.metro_pkm;
    case "walk_cycle":
      return 0;
  }
}

function wasteFactor(d: OrgInputs["scope3"]["food_waste_disposal"]) {
  switch (d) {
    case "landfill":
      return FACTORS.waste_landfill_kg;
    case "compost":
      return FACTORS.waste_compost_kg;
    case "anaerobic":
      return 0.1; // matches IPCC anaerobic
  }
}

function inboundLogisticsAnnualKg(kmPerMonth: number): number {
  // Assume a small commercial diesel van avg ~0.23 kg CO2/km (DEFRA HGV-small).
  return kmPerMonth * MONTHS_PER_YEAR * 0.23;
}

export function calculateOrganization(inputs: OrgInputs): OrgResult {
  orgInputsSchema.parse(inputs);
  const { scope1, scope2, scope3, seats } = inputs;

  // Scope 1
  const lpgKg =
    scope1.lpg_kg_per_month + scope1.lpg_cylinders_per_month * LPG_CYLINDER_KG;
  const cooking_fuel =
    lpgKg * MONTHS_PER_YEAR * FACTORS.lpg +
    scope1.png_m3_per_month * MONTHS_PER_YEAR * FACTORS.png;
  const diesel_backup =
    scope1.diesel_l_per_month * MONTHS_PER_YEAR * FACTORS.diesel;
  const refrigerant =
    scope1.refrigerant_type === "none"
      ? 0
      : scope1.refrigerant_kg_per_year *
        (REFRIGERANT_GWP[scope1.refrigerant_type] ?? 0);
  const scope1Kg = cooking_fuel + diesel_backup + refrigerant;

  // Scope 2
  const electricity =
    scope2.electricity_kwh_per_month * MONTHS_PER_YEAR * FACTORS.electricity_grid;
  const scope2Kg = electricity;

  // Scope 3 — menu (annual)
  const menuAnnual = scope3.menu_items.map((m) => ({
    name: m.name,
    annualKg: m.kgco2e_per_serving * m.monthly_servings * MONTHS_PER_YEAR,
  }));
  const menu_ingredients = menuAnnual.reduce((a, m) => a + m.annualKg, 0);

  const inbound_logistics = inboundLogisticsAnnualKg(
    scope3.inbound_logistics_km_per_month,
  );

  const food_waste =
    scope3.food_waste_kg_per_month *
    MONTHS_PER_YEAR *
    wasteFactor(scope3.food_waste_disposal);

  let packaging = 0;
  for (const [material, kg] of Object.entries(scope3.packaging_kg_per_month)) {
    const f = PACKAGING_KG[material] ?? 0;
    packaging += kg * MONTHS_PER_YEAR * f;
  }

  const commute =
    scope3.employees *
    scope3.employee_avg_commute_km_per_day *
    260 * // ~260 working days/year
    commuteFactor(scope3.employee_dominant_mode) *
    2; // round-trip
  void WEEKS_PER_YEAR;
  void DOMESTIC_FLIGHT_KM_PROXY;

  const scope3Kg =
    menu_ingredients + inbound_logistics + food_waste + packaging + commute;

  const annualKg = scope1Kg + scope2Kg + scope3Kg;

  // Per-cover daily — only meaningful if seats and ingredients provided
  let perCoverDailyKg: number | null = null;
  if (seats > 0) {
    // Assume avg 2 turns/day, 6 days/week effective → ~624 covers/seat/year
    const annualCovers = seats * 2 * 312;
    perCoverDailyKg = annualKg / annualCovers;
  }

  const topMenuOffenders = menuAnnual
    .map((m) => ({
      name: m.name,
      annualKg: m.annualKg,
      pctOfMenu: menu_ingredients > 0 ? (m.annualKg / menu_ingredients) * 100 : 0,
    }))
    .sort((a, b) => b.annualKg - a.annualKg)
    .slice(0, 5);

  return {
    annualKg,
    scope1Kg,
    scope2Kg,
    scope3Kg,
    breakdown: {
      scope1: { cooking_fuel, diesel_backup, refrigerant },
      scope2: { electricity },
      scope3: {
        menu_ingredients,
        inbound_logistics,
        food_waste,
        packaging,
        commute,
      },
    },
    perCoverDailyKg,
    topMenuOffenders,
  };
}
