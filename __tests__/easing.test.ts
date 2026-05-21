import { describe, expect, it } from "vitest";
import { easeOutCubic } from "@/lib/easing";

describe("easeOutCubic", () => {
  it("returns 0 at t=0", () => {
    expect(easeOutCubic(0)).toBe(0);
  });

  it("returns 1 at t=1", () => {
    expect(easeOutCubic(1)).toBe(1);
  });

  it("is monotonically increasing across [0, 1]", () => {
    const samples = Array.from({ length: 11 }, (_, i) => easeOutCubic(i / 10));
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
    }
  });

  it("decelerates (slope at 0 > slope at 1)", () => {
    const slopeStart = easeOutCubic(0.05) - easeOutCubic(0);
    const slopeEnd = easeOutCubic(1) - easeOutCubic(0.95);
    expect(slopeStart).toBeGreaterThan(slopeEnd);
  });
});
