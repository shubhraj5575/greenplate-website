import { describe, it, expect } from "vitest";
import {
  canonicalize,
  mapDataQuality,
  isIndian,
} from "../scripts/lib/canonical";

describe("canonicalize", () => {
  it("lowercases and trims", () => {
    expect(canonicalize("  Wheat  ")).toBe("wheat");
  });

  it("strips parenthetical qualifiers", () => {
    expect(canonicalize("Wheat (Chapatti)")).toBe("wheat");
    expect(canonicalize("Rice (Cooked)")).toBe("rice");
  });

  it("strips bracketed text", () => {
    expect(canonicalize("Tea [black]")).toBe("tea");
  });

  it("ascii-folds accents", () => {
    expect(canonicalize("Périgord")).toBe("perigord");
    expect(canonicalize("São Paulo coffee")).toBe("sao paulo coffee");
  });

  it("removes punctuation", () => {
    expect(canonicalize("Tea, Black.")).toBe("tea black");
  });

  it("naively singularizes", () => {
    expect(canonicalize("Tomatoes")).toBe("tomato");
    expect(canonicalize("Strawberries")).toBe("strawberry");
    expect(canonicalize("Apples")).toBe("apple");
  });

  it("preserves double-s endings", () => {
    expect(canonicalize("Grass")).toBe("grass");
  });

  it("strips common prep suffixes", () => {
    expect(canonicalize("Carrot fresh")).toBe("carrot");
    expect(canonicalize("Beans cooked")).toBe("bean");
    expect(canonicalize("Pea raw")).toBe("pea");
  });

  it("collapses whitespace", () => {
    expect(canonicalize("Basmati    rice")).toBe("basmati rice");
  });
});

describe("mapDataQuality", () => {
  it.each([
    ["Peer-reviewed", "high"],
    ["High", "high"],
    ["Very Good", "high"],
    ["Good", "medium"],
    ["Estimated from import studies", "low"],
    ["Low", "low"],
    [null, "medium"],
    [undefined, "medium"],
  ] as const)("%s -> %s", (input, expected) => {
    expect(mapDataQuality(input)).toBe(expected);
  });
});

describe("isIndian", () => {
  it.each([
    ["India", true],
    ["Pan-India", true],
    ["IN", true],
    ["Global", false],
    ["Europe", false],
    [null, false],
  ] as const)("%s -> %s", (input, expected) => {
    expect(isIndian(input)).toBe(expected);
  });
});
