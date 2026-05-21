"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Editorial hero illustration.
 *
 * Concept: a plate that doubles as a stacked-emissions donut. The arc
 * lengths represent the four food-system stages we measure (production,
 * processing, transport, retail). A leaf curls through the centre as the
 * brand mark. Tick marks around the rim suggest a measuring instrument.
 *
 * The ring rotates very slowly (90s per turn) to feel alive without being
 * decorative. Honours prefers-reduced-motion.
 */
export function HeroVisual() {
  const reduce = useReducedMotion();

  // Stage shares (kg CO2e for an indicative beef-rich plate, normalised to 100).
  // Production: 71%, Processing: 8%, Transport: 13%, Retail: 8%.
  const total = 100;
  const stages = [
    { value: 71, label: "Production", color: "var(--color-forest-900)" },
    { value: 8, label: "Processing", color: "var(--color-forest-500)" },
    { value: 13, label: "Transport", color: "var(--color-amber-500)" },
    { value: 8, label: "Retail", color: "var(--color-leaf-500)" },
  ];

  const R = 132;
  const C = 2 * Math.PI * R;

  let offset = 0;
  const arcs = stages.map((s) => {
    const len = (s.value / total) * C;
    const seg = {
      ...s,
      dashArray: `${len} ${C - len}`,
      dashOffset: -offset,
    };
    offset += len;
    return seg;
  });

  return (
    <div
      className="relative aspect-square w-full max-w-[520px]"
      aria-hidden="true"
    >
      {/* Faint outer halo */}
      <div className="absolute inset-0 -m-6 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(132,169,140,0.18),transparent_60%)]" />

      <svg
        viewBox="0 0 360 360"
        className="relative h-full w-full"
        role="img"
        aria-label="Donut chart showing how a typical Indian-priority plate's emissions break down across production, processing, transport, and retail."
      >
        <defs>
          {/* Subtle grain via turbulence */}
          <filter id="grain" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              seed="4"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.12   0 0 0 0 0.10   0 0 0 0 0.08  0 0 0 0.06 0"
            />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>

          <radialGradient id="plateBody" cx="50%" cy="44%" r="60%">
            <stop offset="0%" stopColor="var(--color-cream-50)" />
            <stop offset="70%" stopColor="var(--color-cream-100)" />
            <stop offset="100%" stopColor="var(--color-cream-200)" />
          </radialGradient>

          <linearGradient id="plateRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-forest-300)" />
            <stop offset="100%" stopColor="var(--color-forest-700)" />
          </linearGradient>
        </defs>

        {/* Plate body */}
        <circle
          cx="180"
          cy="180"
          r="118"
          fill="url(#plateBody)"
          stroke="var(--color-ink-900)"
          strokeOpacity="0.08"
          strokeWidth="1"
        />
        {/* Inner plate well */}
        <circle
          cx="180"
          cy="180"
          r="92"
          fill="none"
          stroke="var(--color-ink-900)"
          strokeOpacity="0.05"
          strokeWidth="1"
        />

        {/* Tick marks (measuring instrument vibe) */}
        <g
          stroke="var(--color-ink-900)"
          strokeOpacity="0.25"
          strokeLinecap="round"
        >
          {Array.from({ length: 60 }).map((_, i) => {
            const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
            const r1 = 152;
            const r2 = i % 5 === 0 ? 160 : 156;
            const x1 = 180 + Math.cos(a) * r1;
            const y1 = 180 + Math.sin(a) * r1;
            const x2 = 180 + Math.cos(a) * r2;
            const y2 = 180 + Math.sin(a) * r2;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeWidth={i % 5 === 0 ? 1.2 : 0.6}
              />
            );
          })}
        </g>

        {/* Rotating data ring */}
        <motion.g
          style={{ transformOrigin: "180px 180px" }}
          initial={{ rotate: -90 }}
          animate={reduce ? { rotate: -90 } : { rotate: 270 }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 90, repeat: Infinity, ease: "linear" }
          }
        >
          {/* Track */}
          <circle
            cx="180"
            cy="180"
            r={R}
            fill="none"
            stroke="var(--color-forest-900)"
            strokeOpacity="0.06"
            strokeWidth="22"
          />
          {arcs.map((a, i) => (
            <circle
              key={i}
              cx="180"
              cy="180"
              r={R}
              fill="none"
              stroke={a.color}
              strokeWidth="22"
              strokeLinecap="butt"
              strokeDasharray={a.dashArray}
              strokeDashoffset={a.dashOffset}
            />
          ))}
        </motion.g>

        {/* Plate rim (over the ring so it nests) */}
        <circle
          cx="180"
          cy="180"
          r="118"
          fill="none"
          stroke="url(#plateRim)"
          strokeOpacity="0.18"
          strokeWidth="1.5"
        />

        {/* Leaf at center */}
        <g transform="translate(180 180)">
          <motion.g
            initial={{ rotate: -6, scale: 0.96, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            style={{ transformOrigin: "center" }}
          >
            <path
              d="M -42 30 C -50 0, -28 -38, 8 -50 C 26 -22, 22 14, -2 32 C -16 42, -32 40, -42 30 Z"
              fill="var(--color-forest-900)"
            />
            <path
              d="M -42 30 C -22 12, -2 -6, 8 -50"
              fill="none"
              stroke="var(--color-cream-50)"
              strokeOpacity="0.65"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M -22 22 C -14 14, -8 6, -2 -2"
              fill="none"
              stroke="var(--color-cream-50)"
              strokeOpacity="0.35"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
            <path
              d="M -12 28 C -6 18, 2 8, 10 -8"
              fill="none"
              stroke="var(--color-cream-50)"
              strokeOpacity="0.35"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
          </motion.g>

          {/* Centre label */}
          <text
            x="0"
            y="58"
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-ink-500)"
            letterSpacing="0.04em"
          >
            one plate · measured
          </text>
        </g>

        {/* Grain overlay */}
        <rect
          x="0"
          y="0"
          width="360"
          height="360"
          filter="url(#grain)"
          opacity="0.5"
          pointerEvents="none"
        />
      </svg>

      {/* Floating data labels */}
      <Label
        className="left-[-2%] top-[18%] sm:left-[-8%]"
        kicker="kg CO₂e"
        value="2.6"
        sub="per kg · paneer"
      />
      <Label
        className="right-[-2%] bottom-[18%] sm:right-[-8%]"
        kicker="Source"
        value="DEFRA"
        sub="2024 update"
        align="right"
      />
      <Label
        className="right-[2%] top-[10%]"
        kicker="Scope 3"
        value="71%"
        sub="of plate emissions"
        align="right"
        accent
      />
    </div>
  );
}

function Label({
  className = "",
  kicker,
  value,
  sub,
  align = "left",
  accent = false,
}: {
  className?: string;
  kicker: string;
  value: string;
  sub: string;
  align?: "left" | "right";
  accent?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={[
        "absolute inline-flex flex-col rounded-2xl border border-ink-900/8 bg-cream-50/90 px-3 py-2 shadow-[var(--shadow-soft)] backdrop-blur",
        align === "right" ? "items-end text-right" : "items-start text-left",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "text-[0.62rem] tracking-[0.18em] uppercase",
          accent ? "text-amber-500" : "text-ink-400",
        ].join(" ")}
      >
        {kicker}
      </span>
      <span className="tabular font-display text-lg leading-none text-forest-900">
        {value}
      </span>
      <span className="mt-0.5 text-[0.7rem] text-ink-500">{sub}</span>
    </div>
  );
}
