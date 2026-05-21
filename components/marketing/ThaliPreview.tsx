"use client";

import { RevealOnView } from "./RevealOnView";

const ITEMS = [
  {
    name: "Rice",
    detail: "100 g cooked",
    kg: 0.7,
    color: "var(--color-forest-900)",
  },
  {
    name: "Toor dal",
    detail: "50 g uncooked",
    kg: 0.41,
    color: "var(--color-forest-700)",
  },
  {
    name: "Mixed sabzi",
    detail: "potato, tomato, onion, spinach · 150 g",
    kg: 0.33,
    color: "var(--color-forest-500)",
  },
  {
    name: "Chapati × 2",
    detail: "60 g atta",
    kg: 0.22,
    color: "var(--color-leaf-500)",
  },
  {
    name: "Dahi",
    detail: "100 g",
    kg: 0.12,
    color: "var(--color-amber-400)",
  },
  {
    name: "Jaggery",
    detail: "20 g",
    kg: 0.06,
    color: "var(--color-ink-500)",
  },
] as const;

const TOTAL = ITEMS.reduce((s, i) => s + i.kg, 0); // 1.84
const R = 96;
const STROKE = 22;
const C = 2 * Math.PI * R;

function Donut() {
  let acc = 0;
  return (
    <svg
      viewBox="-130 -130 260 260"
      className="h-44 w-44 sm:h-52 sm:w-52"
      role="img"
      aria-label="Donut chart of the thali's six components by carbon footprint"
    >
      <circle
        r={R}
        fill="none"
        stroke="var(--color-cream-100)"
        strokeWidth={STROKE}
      />
      {ITEMS.map((it) => {
        const len = (it.kg / TOTAL) * C;
        const seg = (
          <circle
            key={it.name}
            r={R}
            fill="none"
            stroke={it.color}
            strokeWidth={STROKE}
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-acc}
            transform="rotate(-90)"
            strokeLinecap="butt"
          />
        );
        acc += len;
        return seg;
      })}
      <text
        textAnchor="middle"
        y="-6"
        className="font-display fill-forest-900"
        style={{ fontSize: 30, letterSpacing: "-0.02em" }}
      >
        {TOTAL.toFixed(2)}
      </text>
      <text
        textAnchor="middle"
        y="18"
        className="fill-ink-500"
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        kg CO₂e
      </text>
    </svg>
  );
}

export function ThaliPreview() {
  return (
    <section
      aria-labelledby="thali-preview-title"
      className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28"
    >
      <RevealOnView>
        <div className="flex items-center gap-3 text-[0.68rem] tracking-[0.22em] uppercase">
          <span className="tabular text-ink-300">§ 02·b</span>
          <span aria-hidden="true" className="h-px w-8 bg-forest-700/40" />
          <span className="font-medium text-forest-700">A live example</span>
        </div>
        <h2
          id="thali-preview-title"
          className="mt-5 max-w-2xl font-display text-3xl leading-tight text-ink-900 sm:text-4xl"
        >
          What the calculator shows you for{" "}
          <span className="italic text-forest-700">one veg thali</span>.
        </h2>
      </RevealOnView>

      <RevealOnView delay={0.08}>
        <div className="mt-12 grid items-center gap-10 rounded-card border border-ink-900/10 bg-cream-50 p-7 sm:p-10 lg:grid-cols-[auto_1fr] lg:gap-16">
          <div className="flex flex-col items-center text-center">
            <p className="text-[0.62rem] font-semibold tracking-[0.22em] text-forest-700 uppercase">
              Dinner for one
            </p>
            <div className="mt-4">
              <Donut />
            </div>
            <p className="mt-3 max-w-[20ch] text-sm text-ink-500">
              per person, this meal
            </p>
          </div>

          <div>
            <ul className="space-y-3">
              {ITEMS.map((it) => {
                const pct = (it.kg / TOTAL) * 100;
                return (
                  <li
                    key={it.name}
                    className="grid grid-cols-[1fr_auto] items-baseline gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: it.color }}
                        />
                        <span className="text-[0.95rem] font-medium text-ink-900">
                          {it.name}
                        </span>
                      </div>
                      <p className="ml-5 text-xs text-ink-400">{it.detail}</p>
                      <div
                        className="ml-5 mt-1.5 h-1 rounded-full bg-ink-900/5"
                        aria-hidden="true"
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: it.color,
                          }}
                        />
                      </div>
                    </div>
                    <span className="tabular-nums font-display text-base text-forest-900">
                      {it.kg.toFixed(2)} kg
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-7 flex flex-col gap-1 border-t border-ink-900/8 pt-5 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                ≈ a 7 km drive in a petrol car · India veg-dinner avg is{" "}
                <span className="tabular-nums text-ink-700">2.1 kg</span>
              </p>
              <p>
                Source:{" "}
                <a
                  href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5268357/"
                  className="border-b border-forest-700/30 text-forest-700 hover:border-forest-700"
                >
                  Vetter et al. 2017
                </a>
              </p>
            </div>
          </div>
        </div>
      </RevealOnView>
    </section>
  );
}
