"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleLoginButton({ redirectTo }: { redirectTo?: string }) {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const next = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : "";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/api/auth/callback${next}`,
      },
    });
    // No setLoading(false) — the browser is navigating away.
  }

  return (
    <button
      onClick={signIn}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-full bg-forest-900 px-5 py-3 font-medium text-cream-50 transition hover:bg-forest-700 disabled:opacity-60"
    >
      <GoogleIcon />
      {loading ? "Signing in…" : "Continue with Google"}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#FAF6EE"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#FAF6EE"
        opacity="0.85"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FAF6EE"
        opacity="0.7"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#FAF6EE"
        opacity="0.55"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.346l2.582-2.58C13.464.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
