import { IndividualWizard } from "@/components/calc/IndividualWizard";

export const metadata = { title: "Calculate" };

export default function CalculatePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <p className="text-sm font-medium tracking-widest text-forest-700 uppercase">
          Step-by-step
        </p>
        <h1 className="mt-2 font-display text-4xl text-forest-900">
          Your annual carbon footprint.
        </h1>
        <p className="mt-3 text-ink-500">
          Four short steps. We&apos;ll show you exactly how your number was built
          — and what to do about the biggest contributor.
        </p>
      </header>
      <IndividualWizard />
    </main>
  );
}
