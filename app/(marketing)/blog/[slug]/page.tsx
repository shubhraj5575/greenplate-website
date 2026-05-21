import Link from "next/link";
import { notFound } from "next/navigation";

const POSTS: Record<string, { title: string; date: string; body: string }> = {
  "why-food-carbon-matters-india": {
    title: "Why food carbon matters in India",
    date: "2026-05-15",
    body: "Coming soon. India per-capita is a fifth of the global average, but absolute numbers tell a different story.",
  },
  "reading-our-methodology": {
    title: "Reading our methodology, factor by factor",
    date: "2026-05-10",
    body: "Coming soon. A walk-through of every emission factor used by the calculator.",
  },
  "first-restaurant-audit": {
    title: "A restaurant's first carbon audit",
    date: "2026-05-03",
    body: "Coming soon. What happens in week one when you actually count Scope 1, 2, 3.",
  },
};

export async function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) notFound();
  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <p className="text-xs tracking-widest text-ink-400 uppercase tabular">
        {new Date(post.date).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
      <h1 className="mt-2 font-display text-4xl text-forest-900">
        {post.title}
      </h1>
      <p className="mt-8 text-lg text-ink-500">{post.body}</p>
      <Link
        href="/blog"
        className="mt-12 inline-block text-sm text-forest-700 hover:underline"
      >
        ← All notes
      </Link>
    </main>
  );
}
