export const metadata = { title: "Careers" };

const VALUES = [
  {
    title: "Data integrity first",
    description:
      "We’d rather say we don’t know than say something false.",
  },
  {
    title: "India-native",
    description:
      "Our defaults are dal, rice, and LPG. Not steak and natural gas.",
  },
  {
    title: "Open by default",
    description:
      "Methodology, codebase, and data — published where possible.",
  },
];

export default function CareersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-sm font-medium tracking-widest text-forest-700 uppercase">
        Careers
      </p>
      <h1 className="mt-3 font-display text-5xl text-forest-900">
        Work that matters.
      </h1>

      <p className="mt-8 text-lg leading-relaxed text-ink-500">
        GreenPlate is building the measurement layer for India&apos;s food
        sector &mdash; so kitchens, restaurants, and home cooks can finally put
        a number on what they serve. We care about accuracy over optics, Indian
        food systems over borrowed defaults, and open methodology over closed
        black boxes.
      </p>

      <section className="mt-16">
        <h2 className="font-display text-2xl text-forest-900">Values</h2>
        <ul className="mt-8 space-y-8">
          {VALUES.map((v) => (
            <li key={v.title} className="border-b border-forest-700/10 pb-8">
              <h3 className="font-display text-xl text-forest-900">{v.title}</h3>
              <p className="mt-2 text-ink-500">{v.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 rounded-card border border-forest-700/10 bg-bone-100 p-8">
        <h2 className="font-display text-2xl text-forest-900">Open positions</h2>
        <p className="mt-3 text-ink-500">No open positions right now.</p>
      </section>

      <p className="mt-10 text-ink-500">
        Interested in what we&apos;re building? Write to{" "}
        <a
          href="mailto:greenplate@greenplate.online"
          className="underline underline-offset-4 hover:text-forest-700"
        >
          greenplate@greenplate.online
        </a>{" "}
        with a note about your work.
      </p>
    </main>
  );
}
