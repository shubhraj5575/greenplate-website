import { describe, expect, it } from "vitest";
import { parseFaostatCsv } from "@/scripts/scrape-food-sources";

// A representative slice of the FAOSTAT Emissions-intensities bulk CSV.
// Real shape: ~130 columns (Area Code, Area, Item Code, Item, Element,
// Unit + Y1961..Y2023 each with a flag column). We only need the
// identifier columns + a couple of recent year columns for the parser
// to do its work — Papa.parse handles the rest.
const HEADER =
  '"Area Code","Area","Item Code","Item","Element","Unit","Y2020","Y2020F","Y2021","Y2021F","Y2022","Y2022F"';

const INDIA_RICE =
  '"100","India","27","Rice","Emissions intensity","kg CO2eq/kg","2.054900","E","1.971400","E","1.963100","E"';
const INDIA_CATTLE =
  '"100","India","867","Meat of cattle with the bone, fresh or chilled","Emissions intensity","kg CO2eq/kg","277.014900","E","270.023400","E","267.789500","E"';
const INDIA_MILK =
  '"100","India","882","Raw milk of cattle","Emissions intensity","kg CO2eq/kg","2.710000","E","2.680000","E","2.650000","E"';
// Non-India: should be skipped
const AFG_RICE =
  '"2","Afghanistan","27","Rice","Emissions intensity","kg CO2eq/kg","0.113000","E","0.120000","E","0.118000","E"';
// India but wrong Element: should be skipped
const INDIA_EMISSIONS_TOTAL =
  '"100","India","27","Rice","Emissions (CO2eq) (AR5)","kt","381.000000","E","395.000000","E","410.000000","E"';
// India + Emissions intensity but no numeric value
const INDIA_NULL =
  '"100","India","999","Some commodity","Emissions intensity","kg CO2eq/kg","","","",""';

function csv(...rows: string[]): string {
  return [HEADER, ...rows].join("\n");
}

describe("parseFaostatCsv", () => {
  it("returns one staging row per India + Emissions-intensity row", () => {
    const rows = parseFaostatCsv(csv(INDIA_RICE, INDIA_CATTLE, INDIA_MILK));
    expect(rows).toHaveLength(3);
  });

  it("flags every row as Indian and high quality", () => {
    const rows = parseFaostatCsv(csv(INDIA_RICE, INDIA_CATTLE));
    expect(rows.every((r) => r.is_indian === true)).toBe(true);
    expect(rows.every((r) => r.data_quality === "high")).toBe(true);
  });

  it("uses FAOSTAT in the data_source label with the year", () => {
    const rows = parseFaostatCsv(csv(INDIA_RICE));
    expect(rows[0].data_source).toContain("FAOSTAT");
    expect(rows[0].data_source).toContain("2022");
  });

  it("uses the most recent non-empty year value", () => {
    const rows = parseFaostatCsv(csv(INDIA_RICE));
    // INDIA_RICE has Y2022=1.963100 as the most recent value
    expect(rows[0].kgco2e_per_kg).toBeCloseTo(1.9631);
  });

  it("skips non-India rows", () => {
    const rows = parseFaostatCsv(csv(AFG_RICE));
    expect(rows).toEqual([]);
  });

  it("skips rows where Element is not Emissions intensity", () => {
    const rows = parseFaostatCsv(csv(INDIA_EMISSIONS_TOTAL));
    expect(rows).toEqual([]);
  });

  it("skips rows with no numeric year value", () => {
    const rows = parseFaostatCsv(csv(INDIA_NULL));
    expect(rows).toEqual([]);
  });

  it("handles header-only CSV", () => {
    expect(parseFaostatCsv(HEADER)).toEqual([]);
  });

  it("handles empty input", () => {
    expect(parseFaostatCsv("")).toEqual([]);
  });

  it("canonicalizes the raw item name", () => {
    const rows = parseFaostatCsv(csv(INDIA_RICE));
    expect(rows[0].canonical_name).toBe("rice");
  });
});
