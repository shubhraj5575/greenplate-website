"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "forgot";

function mapError(msg: string): string {
  if (msg.includes("Invalid login credentials"))
    return "Incorrect email or password.";
  if (msg.includes("Email not confirmed"))
    return "Confirm your email first — check your inbox.";
  if (msg.includes("User already registered"))
    return "An account with this email exists. Sign in instead.";
  if (msg.includes("Password should be"))
    return "Password must be at least 6 characters.";
  return msg;
}

export function EmailPasswordForm({ redirectTo }: { redirectTo?: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSuccessMessage(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const supabase = createClient();

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/api/auth/callback?type=recovery`,
        });
        if (error) {
          setError(mapError(error.message));
        } else {
          setSuccessMessage("Reset link sent — check your inbox.");
        }
        return;
      }

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(mapError(error.message));
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
          setError(mapError(error.message));
        } else {
          setSuccessMessage(
            "Check your inbox to confirm your account, then sign in.",
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setLoading(false);
    }
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

        {mode !== "forgot" && (
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-pill border border-forest-700/15 bg-cream-50 px-4 py-3 pr-11 text-sm text-ink-900 outline-none transition focus:border-forest-700 focus:ring-1 focus:ring-forest-700/20"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        )}

        {mode === "signin" && (
          <div className="flex justify-end -mt-1">
            <button
              type="button"
              onClick={() => switchMode("forgot")}
              className="text-xs text-ink-400 underline hover:text-forest-700"
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
        {successMessage && (
          <p className="text-xs text-forest-700">{successMessage}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-forest-700 px-5 py-3 font-medium text-cream-50 transition hover:bg-forest-900 disabled:opacity-60"
        >
          {loading
            ? mode === "forgot"
              ? "Sending…"
              : mode === "signin"
                ? "Signing in…"
                : "Creating account…"
            : mode === "forgot"
              ? "Send reset link"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-ink-400">
        {mode === "forgot" ? (
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className="underline hover:text-forest-700"
          >
            Back to sign in
          </button>
        ) : mode === "signin" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="text-forest-700 underline"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="text-forest-700 underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
