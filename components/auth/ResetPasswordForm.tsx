"use client";

import { useState, useTransition } from "react";
import { resetPassword } from "@/app/(auth)/reset-password/actions";

export function ResetPasswordForm() {
  const [showPw, setShowPw] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await resetPassword(formData);
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3">
      <div className="relative">
        <input
          name="password"
          type={showPw ? "text" : "password"}
          required
          minLength={8}
          placeholder="New password (min 8 chars)"
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
      <input
        name="confirm_password"
        type={showPw ? "text" : "password"}
        required
        minLength={8}
        placeholder="Confirm new password"
        className="w-full rounded-pill border border-forest-700/15 bg-cream-50 px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-forest-700 focus:ring-1 focus:ring-forest-700/20"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-forest-700 px-5 py-3 font-medium text-cream-50 transition hover:bg-forest-900 disabled:opacity-60"
      >
        {pending ? "Updating…" : "Set new password"}
      </button>
    </form>
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
