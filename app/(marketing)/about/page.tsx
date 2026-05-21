export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-sm font-medium tracking-widest text-forest-700 uppercase">
        About
      </p>
      <h1 className="mt-3 font-display text-5xl text-forest-900">
        Carbon math, plainly told.
      </h1>
      <p className="mt-8 text-lg leading-relaxed text-ink-500">
        GreenPlate started because the food we love in India doesn&apos;t exist in
        most carbon calculators. Global tools assume a beef-and-dairy default that
        doesn&apos;t reflect a country where the average plate is plant-based but
        the kitchen still burns LPG, and where electricity comes from a grid the
        rest of the world doesn&apos;t share.
      </p>
      <p className="mt-6 text-lg leading-relaxed text-ink-500">
        v2 focuses on measurement — for individuals and for food-service operators.
        It uses peer-reviewed Indian LCA data wherever possible, falls back to the
        best global sources when not, and shows every citation.
      </p>

      <section className="mt-16">
        <h2 className="font-display text-2xl text-forest-900">Team</h2>
        <p className="mt-3 text-ink-500">
          Solo build, India-based. Team page will fill in as we grow.
        </p>
      </section>

      <section className="mt-12 rounded-card border border-forest-700/10 bg-bone-100 p-8">
        <h2 className="font-display text-2xl text-forest-900">Get in touch</h2>
        <p className="mt-3 text-ink-500">
          Questions, data corrections, partnership conversations:{" "}
          <a className="underline" href="mailto:hello@greenplate.in">
            hello@greenplate.in
          </a>
          .
        </p>
      </section>
    </main>
  );
}
