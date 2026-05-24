"use client";

import { submitContact } from "@/app/(marketing)/contact/actions";

export default function ContactForm() {
  return (
    <form action={submitContact} className="mt-10 space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-ink-700"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 w-full rounded-card border border-forest-700/20 bg-cream-50 px-4 py-3 text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-700/40"
            placeholder="Your name"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-ink-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-card border border-forest-700/20 bg-cream-50 px-4 py-3 text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-700/40"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-ink-700"
        >
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          className="mt-1 w-full rounded-card border border-forest-700/20 bg-cream-50 px-4 py-3 text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-700/40"
          placeholder="What's this about?"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-ink-700"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="mt-1 w-full rounded-card border border-forest-700/20 bg-cream-50 px-4 py-3 text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-forest-700/40 resize-y"
          placeholder="Tell us what you have in mind."
        />
      </div>

      <button
        type="submit"
        className="rounded-pill bg-forest-700 px-8 py-3 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-forest-900"
      >
        Send message
      </button>
    </form>
  );
}
