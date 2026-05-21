/**
 * Convert kg CO2e into intuitive equivalents for the dashboard.
 * Sources documented on /methodology.
 */

export interface Equivalents {
  trees: number; // mature trees needed to absorb in 1 year
  carKm: number; // km in an average Indian petrol mid-size car
  smartphoneCharges: number;
  beefBurgers: number;
  flightMinutes: number; // minutes of a domestic short-haul flight
}

export function computeEquivalents(kgco2e: number): Equivalents {
  return {
    trees: kgco2e / 21.77, // 1 mature tree ≈ 21.77 kg CO2/year (USDA / various)
    carKm: kgco2e / 0.165,
    smartphoneCharges: kgco2e / 0.0084,
    beefBurgers: kgco2e / 3.0, // ~3 kg CO2e per beef-burger meal
    flightMinutes: (kgco2e / 0.133) / 12, // 0.133 kg/pkm @ ~720 km/h ≈ 12 km/min
  };
}

/**
 * Indian voluntary-market offset cost mid-range: ~₹1000 per tonne.
 * Returns rupees, rounded to the nearest 10.
 */
export function offsetCostINR(kgco2e: number): number {
  return Math.round((kgco2e / 1000) * 1000 / 10) * 10;
}
