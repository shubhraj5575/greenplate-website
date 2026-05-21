import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="max-w-2xl text-center">
        <p className="text-sm font-medium tracking-widest text-forest-700 uppercase">
          GreenPlate · v2
        </p>
        <h1 className="mt-6 font-display text-5xl leading-[1.05] text-forest-900 sm:text-6xl">
          Measure what you serve.
          <br />
          <span className="italic">Reduce what matters.</span>
        </h1>
        <p className="mt-6 text-lg text-ink-500">
          Carbon footprint measurement for India&rsquo;s food sector — for
          individuals and food-service organizations. Built on real LCA data.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/calculate"
            className="rounded-full bg-forest-700 px-6 py-3 font-medium text-cream-50 transition hover:bg-forest-900"
          >
            Calculate your footprint
          </Link>
          <Link
            href="/org/calculate"
            className="rounded-full border border-forest-700/20 bg-cream-100 px-6 py-3 font-medium text-forest-900 transition hover:border-forest-700/40"
          >
            For restaurants
          </Link>
        </div>
        <p className="mt-16 text-xs tracking-wide text-ink-300 uppercase">
          Foundation scaffold · marketing landing arrives in Phase 3
        </p>
      </div>
    </main>
  );
}
