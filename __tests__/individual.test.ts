import { describe, it, expect } from "vitest";
import {
  calculateIndividual,
  type IndividualInputs,
} from "../lib/calc/individual";
import { computeEquivalents, offsetCostINR } from "../lib/equivalents";
import {
  comparisonVsIndia,
  INDIA_BENCHMARKS,
} from "../lib/india-benchmarks";

const baseInputs: IndividualInputs = {
  household: {
    electricity_kwh_per_month: 300,
    lpg_cylinders_per_month: 1,
    png_m3_per_month: 0,
    water_l_per_day: 150,
    household_size: 3,
  },
  transport: {
    car_km_per_week: 100,
    car_fuel: "petrol_mid",
    two_wheeler_km_per_week: 0,
    bus_km_per_week: 0,
    metro_km_per_week: 0,
    auto_km_per_week: 0,
    train_km_per_year: 0,
    flights_domestic_per_year: 0,
    flights_intl_per_year: 0,
  },
  food: {
    diet_pattern: "non_veg_regular",
    meat_servings_per_week: 4,
    dairy_servings_per_day: 2,
    eating_out_meals_per_week: 2,
  },
  consumption: {
    clothing_level: "med",
    electronics_level: "med",
    household_waste_kg_per_week: 5,
    composts: false,
    recycles: false,
  },
};

describe("calculateIndividual — golden path", () => {
  it("returns positive total for sample inputs", () => {
    const r = calculateIndividual(baseInputs);
    expect(r.annualKg).toBeGreaterThan(0);
    expect(r.monthlyKg).toBeCloseTo(r.annualKg / 12, 5);
  });

  it("plan smoke target: 300 kWh + 1 LPG + 100km/wk car + non-veg reg → 5–8 t/yr household, ~2 t/yr per-capita", () => {
    const r = calculateIndividual(baseInputs);
    // Household of 3 with car + non-veg-reg: plausible 5–8 tCO2e/yr range.
    expect(r.annualKg).toBeGreaterThan(5000);
    expect(r.annualKg).toBeLessThan(8000);
    // Per-capita falls in the 1.5–3.0 t range matching India urban middle-class.
    expect(r.perCapitaShare).toBeGreaterThan(1500);
    expect(r.perCapitaShare).toBeLessThan(3000);
  });

  it("breakdown components sum to total", () => {
    const r = calculateIndividual(baseInputs);
    const sum = Object.values(r.breakdown).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(r.annualKg, 3);
  });

  it("top contributors are sorted descending and have correct percentages", () => {
    const r = calculateIndividual(baseInputs);
    for (let i = 1; i < r.topContributors.length; i++) {
      expect(r.topContributors[i - 1].kg).toBeGreaterThanOrEqual(
        r.topContributors[i].kg,
      );
    }
    expect(r.topContributors[0].pct).toBeGreaterThan(0);
  });

  it("per-capita share = annual / household_size", () => {
    const r = calculateIndividual(baseInputs);
    expect(r.perCapitaShare).toBeCloseTo(r.annualKg / 3, 5);
  });
});

describe("calculateIndividual — diet patterns", () => {
  it("food breakdown depends only on diet_pattern in quick mode", () => {
    // The wizard collects meat/dairy/out-eating servings as informational
    // refinements but they don't change the calc (would double-count).
    const a = calculateIndividual({
      ...baseInputs,
      food: { ...baseInputs.food, meat_servings_per_week: 0 },
    });
    const b = calculateIndividual({
      ...baseInputs,
      food: { ...baseInputs.food, meat_servings_per_week: 10 },
    });
    expect(a.breakdown.food).toBeCloseTo(b.breakdown.food, 5);
  });

  it("vegan diet has lower food footprint than non-veg regular", () => {
    const v = calculateIndividual({
      ...baseInputs,
      food: { ...baseInputs.food, diet_pattern: "vegan", meat_servings_per_week: 0 },
    });
    const nv = calculateIndividual({
      ...baseInputs,
      food: { ...baseInputs.food, diet_pattern: "non_veg_regular" },
    });
    expect(v.breakdown.food).toBeLessThan(nv.breakdown.food);
  });
});

describe("calculateIndividual — transport", () => {
  it("more flight km → higher air_transport", () => {
    const noFlight = calculateIndividual(baseInputs);
    const withFlights = calculateIndividual({
      ...baseInputs,
      transport: { ...baseInputs.transport, flights_domestic_per_year: 4 },
    });
    expect(withFlights.breakdown.air_transport).toBeGreaterThan(
      noFlight.breakdown.air_transport,
    );
    expect(withFlights.annualKg).toBeGreaterThan(noFlight.annualKg);
  });

  it("CNG car has lower road_transport than diesel for the same km", () => {
    const cng = calculateIndividual({
      ...baseInputs,
      transport: { ...baseInputs.transport, car_fuel: "cng" },
    });
    const diesel = calculateIndividual({
      ...baseInputs,
      transport: { ...baseInputs.transport, car_fuel: "diesel_mid" },
    });
    expect(cng.breakdown.road_transport).toBeLessThan(
      diesel.breakdown.road_transport,
    );
  });
});

describe("calculateIndividual — waste", () => {
  it("composting + recycling reduces waste emissions", () => {
    const none = calculateIndividual({
      ...baseInputs,
      consumption: {
        ...baseInputs.consumption,
        composts: false,
        recycles: false,
      },
    });
    const both = calculateIndividual({
      ...baseInputs,
      consumption: { ...baseInputs.consumption, composts: true, recycles: true },
    });
    expect(both.breakdown.waste).toBeLessThan(none.breakdown.waste);
  });
});

describe("calculateIndividual — validation", () => {
  it("rejects negative electricity", () => {
    expect(() =>
      calculateIndividual({
        ...baseInputs,
        household: { ...baseInputs.household, electricity_kwh_per_month: -10 },
      }),
    ).toThrow();
  });
});

describe("equivalents", () => {
  it("produces non-negative numbers", () => {
    const e = computeEquivalents(1000);
    expect(e.trees).toBeGreaterThan(0);
    expect(e.carKm).toBeGreaterThan(0);
    expect(e.smartphoneCharges).toBeGreaterThan(0);
  });

  it("scales linearly", () => {
    const a = computeEquivalents(1000);
    const b = computeEquivalents(2000);
    expect(b.trees).toBeCloseTo(a.trees * 2, 5);
    expect(b.carKm).toBeCloseTo(a.carKm * 2, 5);
  });

  it("offsetCostINR scales linearly per tonne ~₹1000", () => {
    expect(offsetCostINR(1000)).toBe(1000);
    expect(offsetCostINR(2500)).toBe(2500);
  });
});

describe("india-benchmarks", () => {
  it("comparison produces sensible percentages", () => {
    const c = comparisonVsIndia(INDIA_BENCHMARKS.individual_avg);
    expect(c.pctOfAvg).toBeCloseTo(100, 1);
    expect(c.pctOfGlobal).toBeLessThan(100);
  });
});
