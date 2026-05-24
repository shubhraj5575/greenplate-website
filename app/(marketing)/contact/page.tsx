import ContactForm from "@/components/marketing/ContactForm";

export const metadata = { title: "Contact" };

interface ContactPageProps {
  searchParams: Promise<{ sent?: string }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const sent = params.sent === "1";

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-sm font-medium tracking-widest text-forest-700 uppercase">
        Contact
      </p>
      <h1 className="mt-3 font-display text-5xl text-forest-900">
        Talk to us.
      </h1>

      {sent ? (
        <div className="mt-10 rounded-card border border-forest-700/20 bg-bone-100 p-8">
          <p className="text-lg font-medium text-forest-900">
            Thanks — we&apos;ll be in touch.
          </p>
          <p className="mt-2 text-ink-500">
            We typically respond within 1 business day.
          </p>
        </div>
      ) : (
        <ContactForm />
      )}

      <div className="mt-16 rounded-card border border-forest-700/10 bg-bone-100 p-8">
        <p className="text-sm font-medium tracking-widest text-forest-700 uppercase">
          Email us directly
        </p>
        <a
          href="mailto:greenplate@greenplate.online"
          className="mt-2 block text-lg text-forest-900 underline underline-offset-4 hover:text-forest-700"
        >
          greenplate@greenplate.online
        </a>
        <p className="mt-3 text-sm text-ink-400">
          We typically respond within 1 business day.
        </p>
      </div>
    </main>
  );
}
