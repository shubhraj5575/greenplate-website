import { describe, expect, it } from "vitest";
import { emptyToNumberOrUndefined } from "@/lib/utils";

describe("emptyToNumberOrUndefined", () => {
  it("returns undefined for empty string", () => {
    expect(emptyToNumberOrUndefined("")).toBeUndefined();
  });

  it("returns undefined for null", () => {
    expect(emptyToNumberOrUndefined(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(emptyToNumberOrUndefined(undefined)).toBeUndefined();
  });

  it("returns undefined for NaN input", () => {
    expect(emptyToNumberOrUndefined(NaN)).toBeUndefined();
  });

  it("returns undefined for non-numeric strings", () => {
    expect(emptyToNumberOrUndefined("abc")).toBeUndefined();
  });

  it("parses integer strings", () => {
    expect(emptyToNumberOrUndefined("42")).toBe(42);
  });

  it("parses decimal strings", () => {
    expect(emptyToNumberOrUndefined("3.14")).toBeCloseTo(3.14);
  });

  it("parses negative decimal strings", () => {
    expect(emptyToNumberOrUndefined("-0.5")).toBeCloseTo(-0.5);
  });

  it("passes finite numbers through unchanged", () => {
    expect(emptyToNumberOrUndefined(7)).toBe(7);
    expect(emptyToNumberOrUndefined(0)).toBe(0);
  });

  it("returns undefined for Infinity", () => {
    expect(emptyToNumberOrUndefined(Infinity)).toBeUndefined();
    expect(emptyToNumberOrUndefined(-Infinity)).toBeUndefined();
  });

  it("trims surrounding whitespace before parsing", () => {
    expect(emptyToNumberOrUndefined(" 12 ")).toBe(12);
    expect(emptyToNumberOrUndefined("   ")).toBeUndefined();
  });
});
