import Link from "next/link";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { EmailPasswordForm } from "@/components/auth/EmailPasswordForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_to?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="block text-center font-display text-3xl text-forest-900"
        >
          GreenPlate
        </Link>
        <p className="mt-3 text-center text-sm text-ink-500">
          Sign in to measure and track your carbon footprint.
        </p>

        <div className="mt-10 rounded-card border border-forest-700/10 bg-bone-100 p-6 shadow-soft">
          <EmailPasswordForm redirectTo={sp.redirect_to} />
          <p className="my-5 text-center text-xs text-ink-400">or</p>
          <GoogleLoginButton redirectTo={sp.redirect_to} />
          {sp.error && (
            <p className="mt-4 text-center text-xs text-danger">
              Sign-in failed: {decodeURIComponent(sp.error)}
            </p>
          )}
          <p className="mt-6 text-center text-xs text-ink-400">
            By continuing you agree to our{" "}
            <Link href="/methodology" className="underline">
              methodology
            </Link>
            .
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-ink-400">
          New here?{" "}
          <Link href="/how-it-works" className="underline">
            See how it works
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
