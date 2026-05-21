import { FACTORS } from "@/lib/calc/factors";
import { formatNumber } from "@/lib/utils";

export const metadata = { title: "Methodology" };

const SECTIONS = [
  {
    title: "Electricity",
    rows: [
      ["India grid (national avg)", FACTORS.electricity_grid, "kg / kWh", "CEA CO₂ Baseline Database, 2023"],
    ],
  },
  {
    title: "Cooking fuels",
    rows: [
      ["LPG", FACTORS.lpg, "kg / kg fuel", "IPCC 2006 Guidelines, Vol. 2"],
      ["PNG", FACTORS.png, "kg / m³", "PNGRB"],
    ],
  },
  {
    title: "Liquid fuels",
    rows: [
      ["Petrol", FACTORS.petrol, "kg / litre", "DEFRA 2024"],
      ["Diesel", FACTORS.diesel, "kg / litre", "DEFRA 2024"],
      ["CNG (motor)", FACTORS.cng_kg, "kg / kg fuel", "IPCC 2006"],
    ],
  },
  {
    title: "Road transport",
    rows: [
      ["Two-wheeler (petrol)", FACTORS.two_wheeler_km, "kg / km", "ICAT India 2022"],
      ["Car petrol (small)", FACTORS.car_petrol_small_km, "kg / km", "ICAT India 2022"],
      ["Car petrol (mid)", FACTORS.car_petrol_mid_km, "kg / km", "ICAT India 2022"],
      ["Car diesel (mid)", FACTORS.car_diesel_mid_km, "kg / km", "ICAT India 2022"],
      ["Car CNG", FACTORS.car_cng_km, "kg / km", "ICAT India 2022"],
      ["Auto-rickshaw (CNG)", FACTORS.auto_rickshaw_km, "kg / km", "ICAT India 2022"],
      ["Bus (diesel)", FACTORS.bus_pkm, "kg / passenger-km", "ICAT India 2022"],
    ],
  },
  {
    title: "Rail + air",
    rows: [
      ["Indian Railways (electric)", FACTORS.rail_electric_pkm, "kg / passenger-km", "Indian Railways Env Report 2022"],
      ["Urban metro", FACTORS.metro_pkm, "kg / passenger-km", "DMRC / BMRCL reports"],
      ["Domestic flight", FACTORS.flight_domestic_pkm, "kg / passenger-km", "DEFRA 2024 (adapted)"],
      ["International flight", FACTORS.flight_intl_pkm, "kg / passenger-km", "DEFRA 2024"],
    ],
  },
];

export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <p className="text-sm font-medium tracking-widest text-forest-700 uppercase">
        Methodology
      </p>
      <h1 className="mt-3 font-display text-5xl text-forest-900">
        Every number cites a source.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-ink-500">
        Below is the full list of emission factors used by our calculator. India-specific
        factors are preferred over global defaults. Where India data is unavailable,
        we use adapted DEFRA or IPCC factors and label the lower confidence.
      </p>

      <div className="mt-16 space-y-12">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-2xl text-forest-900">{s.title}</h2>
            <div className="mt-4 overflow-hidden rounded-card border border-forest-700/10 bg-bone-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-forest-700/5 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Factor</th>
                    <th className="px-4 py-3 text-right font-medium">Value</th>
                    <th className="px-4 py-3 font-medium">Unit</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-700/10">
                  {s.rows.map(([name, val, unit, source]) => (
                    <tr key={String(name)} className="text-ink-700">
                      <td className="px-4 py-3 font-medium text-ink-900">{name}</td>
                      <td className="px-4 py-3 text-right tabular">
                        {formatNumber(Number(val), { maximumFractionDigits: 4 })}
                      </td>
                      <td className="px-4 py-3 text-ink-500">{unit}</td>
                      <td className="px-4 py-3 text-xs text-ink-500">{source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-16 rounded-card border border-amber-500/30 bg-amber-500/5 p-8">
        <h2 className="font-display text-2xl text-amber-600">Food carbon</h2>
        <p className="mt-3 text-ink-700">
          The food calculator uses the diet-pattern model (five patterns from vegan to
          regular non-vegetarian), backed by composite averages of the Indian Food LCA
          Database (~964 products, peer-reviewed) and OWID&apos;s Poore &amp; Nemecek 2018
          dataset. The menu-builder mode for restaurants uses per-ingredient grams from
          our 1,500+ Indian food carbon database.
        </p>
        <p className="mt-3 text-ink-700">
          Per-item carbon values are visible in the menu builder and include the
          primary data source plus alternative sources for transparency.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-forest-900">Limitations</h2>
        <ul className="mt-4 list-inside list-disc space-y-2 text-ink-500">
          <li>India grid factor is a national average; state-level variation can be ±30%.</li>
          <li>Flight emissions exclude radiative-forcing multipliers (RFI ~1.9× for high-altitude effects).</li>
          <li>Refrigerant emissions assume HFC top-up only; cradle-to-grave manufacturing is out of scope for v2.</li>
          <li>Food-pattern model is a simplification; menu-builder mode is recommended for restaurants seeking precision.</li>
        </ul>
      </section>
    </main>
  );
}
