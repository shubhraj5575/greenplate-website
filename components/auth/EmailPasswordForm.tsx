"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  redirectTo?: string;
}

export function EmailPasswordForm({ redirectTo }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(error.message);
        } else {
          window.location.href = redirectTo || "/dashboard";
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });
        if (error) {
          setError(error.message);
        } else {
          setSuccessMessage("Check your email to confirm your account.");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
    setSuccessMessage(null);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-pill border border-forest-700/15 bg-cream-50 px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-forest-700 focus:ring-1 focus:ring-forest-700/20"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-pill border border-forest-700/15 bg-cream-50 px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-forest-700 focus:ring-1 focus:ring-forest-700/20"
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        {successMessage && (
          <p className="mt-2 text-xs text-forest-700">{successMessage}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-forest-700 px-5 py-3 font-medium text-cream-50 transition hover:bg-forest-900 disabled:opacity-60"
        >
          {loading
            ? mode === "signin"
              ? "Signing in…"
              : "Creating account…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
      <p className="mt-3 text-center">
        {mode === "signin" ? (
          <>
            Don&apos;t have an account?{" "}
            <span
              onClick={switchMode}
              className="cursor-pointer text-xs text-forest-700 underline"
            >
              Sign up
            </span>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <span
              onClick={switchMode}
              className="cursor-pointer text-xs text-forest-700 underline"
            >
              Sign in
            </span>
          </>
        )}
      </p>
    </div>
  );
}
