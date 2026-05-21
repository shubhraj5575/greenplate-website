/**
 * Ease-out cubic — fast start, decelerating finish. t in [0, 1].
 * Used by CountUp and any other on-view animation that should
 * "settle" rather than "land".
 */
export function easeOutCubic(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(1 - t, 3);
}
