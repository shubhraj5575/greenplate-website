import Link from "next/link";
import { POSTS } from "@/data/posts";

export const metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-sm font-medium tracking-widest text-forest-700 uppercase">
        Notes
      </p>
      <h1 className="mt-3 font-display text-5xl text-forest-900">
        Writing about food, data, and the slow work of measuring.
      </h1>

      <ul className="mt-16 space-y-10">
        {POSTS.map((p) => (
          <li key={p.slug} className="border-b border-forest-700/10 pb-10">
            <p className="text-xs tracking-widest text-ink-400 uppercase tabular">
              {new Date(p.date).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h2 className="mt-2 font-display text-2xl text-forest-900">
              <Link
                href={`/blog/${p.slug}`}
                className="hover:underline underline-offset-4"
              >
                {p.title}
              </Link>
            </h2>
            <p className="mt-2 text-ink-500">{p.excerpt}</p>
          </li>
        ))}
      </ul>

      <p className="mt-16 text-sm text-ink-400">
        Full posts ship in a follow-up build. The slug routes resolve to a
        coming-soon page for now.
      </p>
    </main>
  );
}
