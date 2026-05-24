import { RevealOnView } from "@/components/marketing/RevealOnView";

const testimonials = [
  {
    quote:
      "For our offices in Delhi, GreenPlate finally put a number on something we used to argue about in slides. Five minutes of inputs, and our team had a footprint we could actually plan against.",
    name: "Om Prakash Ojha",
    role: "India Head, Magic Logistics",
    initial: "O",
  },
  {
    quote:
      "Running a restaurant, the carbon question was always abstract — until we ran our menu through GreenPlate. Now every new dish we add comes with a per-cover figure on the same page as its margin.",
    name: "Pratik Shetty",
    role: "Co-Founder, The Reservoire",
    initial: "P",
  },
];

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3 text-[0.68rem] tracking-[0.22em] uppercase">
      <span className="tabular text-ink-300">§ {index}</span>
      <span aria-hidden="true" className="h-px w-8 bg-forest-700/40" />
      <span className="font-medium text-forest-700">{title}</span>
    </div>
  );
}

export function Testimonials() {
  return (
    <section
      aria-labelledby="testimonials-title"
      className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32"
    >
      <RevealOnView>
        <SectionLabel index="06" title="What people say" />
        <h2
          id="testimonials-title"
          className="mt-5 font-display text-3xl leading-tight tracking-tight text-ink-900 sm:text-4xl"
        >
          Trusted by kitchens and teams across India.
        </h2>
      </RevealOnView>

      <ul className="mt-12 grid gap-6 md:grid-cols-2">
        {testimonials.map((t, i) => (
          <RevealOnView key={t.name} delay={Math.min(i * 0.08, 0.16)}>
            <li className="relative rounded-card border border-forest-700/10 bg-bone-100 p-7">
              <span
                aria-hidden="true"
                className="absolute -top-4 left-6 font-display text-[5rem] leading-none text-forest-900/15 select-none"
              >
                &ldquo;
              </span>
              <blockquote className="relative pt-4">
                <p className="font-display text-xl italic leading-relaxed text-ink-900">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <figcaption className="mt-6 flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-700/10 font-display text-base font-medium text-forest-700"
                  >
                    {t.initial}
                  </span>
                  <span>
                    <span className="block font-medium text-ink-900">
                      {t.name}
                    </span>
                    <span className="block text-xs tracking-wide text-ink-400 uppercase">
                      {t.role}
                    </span>
                  </span>
                </figcaption>
              </blockquote>
            </li>
          </RevealOnView>
        ))}
      </ul>
    </section>
  );
}
