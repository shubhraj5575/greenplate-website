import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { POSTS } from "@/app/(marketing)/blog/page";
import { RevealOnView } from "./RevealOnView";

// Rough words-per-minute → read time estimate.
function readMinutes(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

export function JournalCards() {
  return (
    <section
      aria-labelledby="journal-title"
      className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28"
    >
      <RevealOnView>
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 text-[0.68rem] tracking-[0.22em] uppercase">
              <span className="tabular text-ink-300">§ 04</span>
              <span aria-hidden="true" className="h-px w-8 bg-forest-700/40" />
              <span className="font-medium text-forest-700">Journal</span>
            </div>
            <h2
              id="journal-title"
              className="mt-5 font-display text-3xl leading-tight text-ink-900 sm:text-4xl"
            >
              Notes from{" "}
              <span className="italic text-forest-700">the team</span>.
            </h2>
          </div>
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-sm font-medium text-forest-900"
          >
            <span className="border-b border-forest-900/30 pb-0.5 transition-colors group-hover:border-forest-900">
              Read all notes
            </span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </RevealOnView>

      <ul className="mt-12 grid gap-5 md:grid-cols-3">
        {POSTS.map((p, i) => {
          const minutes = readMinutes(p.excerpt);
          return (
            <RevealOnView key={p.slug} delay={Math.min(i * 0.08, 0.16)}>
              <li className="group h-full">
                <Link
                  href={`/blog/${p.slug}`}
                  className="flex h-full flex-col rounded-card border border-ink-900/8 bg-cream-50 p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-forest-900/20 hover:shadow-[var(--shadow-card)]"
                >
                  <p className="text-[0.62rem] font-semibold tracking-[0.22em] text-forest-700 uppercase">
                    {new Date(p.date).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <h3 className="mt-4 font-display text-2xl leading-snug text-ink-900">
                    {p.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-[0.95rem] leading-relaxed text-ink-500">
                    {p.excerpt}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-6 text-xs text-ink-400">
                    <span>{minutes} min read</span>
                    <ArrowRight className="h-4 w-4 text-forest-700 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </li>
            </RevealOnView>
          );
        })}
      </ul>
    </section>
  );
}
