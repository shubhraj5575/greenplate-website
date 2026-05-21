"use client";

import { useState, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

type QA = { q: string; a: React.ReactNode };

const items: QA[] = [
  {
    q: "Is this for me, or for a business?",
    a: (
      <>
        Both. Individuals can log meals and track personal footprint over time.
        Restaurants, cafes, and cloud kitchens get a structured Scope 1 / 2 / 3
        ledger built around the menu, the kitchen, and the supply chain. Same
        engine underneath — different surfaces.
      </>
    ),
  },
  {
    q: "How accurate are the numbers?",
    a: (
      <>
        Each food item carries a kg CO<sub>2</sub>e per kg factor from a named
        source — Agribalyse, DEFRA, FAO, or peer-reviewed Indian LCA studies.
        Where evidence is thin we say so and show a confidence band. We&rsquo;d
        rather be honest about the error bars than confident and wrong.
      </>
    ),
  },
  {
    q: "Why is India-specific data important?",
    a: (
      <>
        A dairy footprint computed off European feed yields and grid mixes
        doesn&rsquo;t describe an Indian dairy. Our database prioritises Indian
        production systems, CEA grid factors, and ICAT-aligned methods. When we
        have to borrow a global factor, it&rsquo;s labelled clearly.
      </>
    ),
  },
  {
    q: "Do you sell offsets?",
    a: (
      <>
        No. v2 is measurement-only. We don&rsquo;t monetise offsets, we
        don&rsquo;t partner with offset brokers, and we don&rsquo;t certify
        anything as &ldquo;net zero.&rdquo; Reduction comes from reading the
        numbers, not from buying credits.
      </>
    ),
  },
  {
    q: "Is my data private?",
    a: (
      <>
        Your menu, your meal logs, and your suppliers are yours. We never sell
        them, never share with advertisers, and never train external models on
        them. Aggregated, anonymised insights may inform our public methodology
        — opt-in only.
      </>
    ),
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const baseId = useId();

  return (
    <ul className="divide-y divide-ink-900/10 border-y border-ink-900/10">
      {items.map((item, i) => {
        const open = openIdx === i;
        const id = `${baseId}-${i}`;
        return (
          <li key={i}>
            <h3>
              <button
                type="button"
                id={`${id}-button`}
                aria-expanded={open}
                aria-controls={`${id}-panel`}
                onClick={() => setOpenIdx(open ? null : i)}
                className="group flex w-full items-center justify-between gap-6 py-6 text-left transition-colors hover:text-forest-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest-700 sm:py-7"
              >
                <span className="flex items-baseline gap-4 sm:gap-6">
                  <span
                    aria-hidden="true"
                    className="tabular w-8 shrink-0 font-sans text-xs tracking-[0.2em] text-ink-300 uppercase"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-xl leading-snug text-ink-900 sm:text-2xl">
                    {item.q}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={[
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-300",
                    open
                      ? "rotate-45 border-forest-900 bg-forest-900 text-cream-50"
                      : "border-ink-900/20 text-ink-700 group-hover:border-forest-900",
                  ].join(" ")}
                >
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={`${id}-panel`}
                  role="region"
                  aria-labelledby={`${id}-button`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: "auto",
                    opacity: 1,
                    transition: {
                      height: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                      opacity: { duration: 0.25, delay: 0.08 },
                    },
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    transition: {
                      height: { duration: 0.28, ease: [0.4, 0, 1, 1] },
                      opacity: { duration: 0.15 },
                    },
                  }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="grid grid-cols-[3rem_1fr] gap-4 pb-7 sm:grid-cols-[3.5rem_1fr] sm:gap-6">
                    <div aria-hidden="true" className="h-px" />
                    <p className="max-w-2xl text-base leading-relaxed text-ink-500">
                      {item.a}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
