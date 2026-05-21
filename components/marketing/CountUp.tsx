"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { easeOutCubic } from "@/lib/easing";

interface Props {
  to: number;
  suffix?: string;
  prefix?: string;
  durationMs?: number;
  locale?: string;
}

export function CountUp({
  to,
  suffix = "",
  prefix = "",
  durationMs = 1200,
  locale = "en-IN",
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setV(Math.round(to * easeOutCubic(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, to, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {v.toLocaleString(locale)}
      {suffix}
    </span>
  );
}
