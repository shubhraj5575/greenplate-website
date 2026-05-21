import Link from "next/link";

export const metadata = { title: "How it works" };

const STEPS = [
  {
    no: "01",
    title: "Tell us about your life or your kitchen",
    body: "Four short steps for individuals, five for organizations. Utility bills, distance estimates, diet pattern, menu. Nothing leaves your browser until you submit.",
  },
  {
    no: "02",
    title: "We calculate against India-specific factors",
    body: "Every kilometre, kilowatt and kilogram is multiplied by an emission factor sourced from the CEA, ICAT India, PNGRB, IPCC, DEFRA, OWID and AGRIBALYSE. Citations are visible on the methodology page.",
  },
  {
    no: "03",
    title: "You see exactly what's driving the number",
    body: "A donut breakdown, India-average comparison, intuitive equivalents (trees, car km, flight minutes), and a focused list of the three biggest contributors — so you know what to act on first.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-sm font-medium tracking-widest text-forest-700 uppercase">
        How it works
      </p>
      <h1 className="mt-3 font-display text-5xl text-forest-900">
        Three honest steps. <span className="italic">No theatrics.</span>
      </h1>
      <p className="mt-6 max-w-xl text-lg text-ink-500">
        We don&rsquo;t use proprietary &ldquo;sustainability scores&rdquo;. We
        compute kilograms of CO₂-equivalent against the most credible public
        data available for India, and show our work.
      </p>

      <ol className="mt-16 space-y-12">
        {STEPS.map((s) => (
          <li key={s.no} className="grid gap-6 sm:grid-cols-[80px_1fr]">
            <span className="font-display text-5xl tabular text-forest-700/40">
              {s.no}
            </span>
            <div>
              <h2 className="font-display text-2xl text-forest-900">
                {s.title}
              </h2>
              <p className="mt-3 text-ink-500">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-20 rounded-card border border-forest-700/10 bg-bone-100 p-8">
        <h2 className="font-display text-2xl text-forest-900">
          What it doesn&rsquo;t do
        </h2>
        <p className="mt-3 text-ink-500">
          GreenPlate v2 is measurement-only. We do not sell offsets, certify
          carbon-neutral status, or claim to predict net-zero pathways. The
          offset marketplace is a future phase — and one we&rsquo;d rather
          build slowly than badly.
        </p>
      </div>

      <div className="mt-16 flex flex-wrap gap-3">
        <Link
          href="/login?redirect_to=/calculate"
          className="rounded-full bg-forest-700 px-6 py-3 font-medium text-cream-50 transition hover:bg-forest-900"
        >
          Try it now
        </Link>
        <Link
          href="/methodology"
          className="rounded-full border border-forest-700/20 bg-cream-100 px-6 py-3 font-medium text-forest-900 transition hover:border-forest-700/40"
        >
          See the methodology
        </Link>
      </div>
    </main>
  );
}
