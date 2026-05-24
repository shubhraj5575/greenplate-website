import { describe, it, expect } from "vitest";
import {
  calculateOrganization,
  type OrgInputs,
} from "../lib/calc/organization";

const baseOrg: OrgInputs = {
  scope1: {
    lpg_kg_per_month: 25,
    lpg_cylinders_per_month: 0,
    png_m3_per_month: 0,
    diesel_l_per_month: 0,
    refrigerant_type: "r410a",
    refrigerant_kg_per_year: 0.2,
  },
  scope2: { electricity_kwh_per_month: 800 },
  scope3: {
    menu_items: [
      { kind: "legacy" as const, name: "Paneer Tikka", kgco2e_per_serving: 0.9, monthly_servings: 800 },
      { kind: "legacy" as const, name: "Masala Chai", kgco2e_per_serving: 0.12, monthly_servings: 2000 },
      { kind: "legacy" as const, name: "Veg Biryani", kgco2e_per_serving: 1.1, monthly_servings: 600 },
    ],
    inbound_logistics_km_per_month: 600,
    food_waste_kg_per_month: 40,
    food_waste_disposal: "landfill",
    packaging_kg_per_month: {
      plastic_pet: 8,
      plastic_hdpe: 2,
      paper_cardboard: 25,
      aluminium: 1,
      glass: 0,
      steel_tin: 0,
    },
    employees: 8,
    employee_avg_commute_km_per_day: 12,
    employee_dominant_mode: "two_wheeler",
  },
  seats: 40,
};

describe("calculateOrganization", () => {
  it("plan smoke target: small cafe → totals are positive and Scope 3 dominates", () => {
    const r = calculateOrganization(baseOrg);
    expect(r.annualKg).toBeGreaterThan(0);
    expect(r.scope3Kg).toBeGreaterThan(r.scope2Kg);
    expect(r.scope3Kg).toBeGreaterThan(r.scope1Kg);
  });

  it("scopes sum to total", () => {
    const r = calculateOrganization(baseOrg);
    expect(r.scope1Kg + r.scope2Kg + r.scope3Kg).toBeCloseTo(r.annualKg, 3);
  });

  it("scope 1 components add up", () => {
    const r = calculateOrganization(baseOrg);
    const { cooking_fuel, diesel_backup, refrigerant } = r.breakdown.scope1;
    expect(cooking_fuel + diesel_backup + refrigerant).toBeCloseTo(r.scope1Kg, 3);
  });

  it("electricity at 800 kWh/mo gives ~6.9 t/yr at CEA factor", () => {
    const r = calculateOrganization(baseOrg);
    // 800 × 12 × 0.716 = 6873.6
    expect(r.breakdown.scope2.electricity).toBeCloseTo(6873.6, 1);
  });

  it("refrigerant: R-410a × 0.2 kg/yr = 417.6 kg CO2e", () => {
    const r = calculateOrganization(baseOrg);
    expect(r.breakdown.scope1.refrigerant).toBeCloseTo(2088 * 0.2, 1);
  });

  it("none-type refrigerant produces zero refrigerant emissions", () => {
    const r = calculateOrganization({
      ...baseOrg,
      scope1: { ...baseOrg.scope1, refrigerant_type: "none" },
    });
    expect(r.breakdown.scope1.refrigerant).toBe(0);
  });

  it("top menu offenders sorted descending by annual kg", () => {
    const r = calculateOrganization(baseOrg);
    for (let i = 1; i < r.topMenuOffenders.length; i++) {
      expect(r.topMenuOffenders[i - 1].annualKg).toBeGreaterThanOrEqual(
        r.topMenuOffenders[i].annualKg,
      );
    }
  });

  it("per-cover is null when seats=0, populated when seats>0", () => {
    const noSeats = calculateOrganization({ ...baseOrg, seats: 0 });
    expect(noSeats.perCoverDailyKg).toBeNull();
    const withSeats = calculateOrganization(baseOrg);
    expect(withSeats.perCoverDailyKg).toBeGreaterThan(0);
  });

  it("composting food waste reduces emissions vs landfill", () => {
    const landfill = calculateOrganization(baseOrg);
    const compost = calculateOrganization({
      ...baseOrg,
      scope3: { ...baseOrg.scope3, food_waste_disposal: "compost" },
    });
    expect(compost.breakdown.scope3.food_waste).toBeLessThan(
      landfill.breakdown.scope3.food_waste,
    );
  });

  it("packaging materials add proportionally", () => {
    const r = calculateOrganization(baseOrg);
    expect(r.breakdown.scope3.packaging).toBeGreaterThan(0);
    const noPack = calculateOrganization({
      ...baseOrg,
      scope3: {
        ...baseOrg.scope3,
        packaging_kg_per_month: {
          plastic_pet: 0,
          plastic_hdpe: 0,
          paper_cardboard: 0,
          aluminium: 0,
          glass: 0,
          steel_tin: 0,
        },
      },
    });
    expect(noPack.breakdown.scope3.packaging).toBe(0);
  });

  it("LPG via cylinders matches LPG via kg for equivalent mass", () => {
    const viaKg = calculateOrganization({
      ...baseOrg,
      scope1: {
        ...baseOrg.scope1,
        lpg_kg_per_month: 28.4,
        lpg_cylinders_per_month: 0,
      },
    });
    const viaCylinders = calculateOrganization({
      ...baseOrg,
      scope1: {
        ...baseOrg.scope1,
        lpg_kg_per_month: 0,
        lpg_cylinders_per_month: 2,
      },
    });
    // 2 × 14.2 = 28.4 kg, so should match exactly
    expect(viaCylinders.breakdown.scope1.cooking_fuel).toBeCloseTo(
      viaKg.breakdown.scope1.cooking_fuel,
      3,
    );
  });

  it("validates: rejects negative electricity", () => {
    expect(() =>
      calculateOrganization({
        ...baseOrg,
        scope2: { electricity_kwh_per_month: -10 },
      }),
    ).toThrow();
  });
});
