import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No recovery session — reset link was already used or expired.
  if (!user) redirect("/login?error=Reset+link+expired+or+already+used.");

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
          Choose a new password for your account.
        </p>
        <div className="mt-10 rounded-card border border-forest-700/10 bg-bone-100 p-6 shadow-soft">
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
